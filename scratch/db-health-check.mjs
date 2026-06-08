import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local file not found. Please create it first.");
  }
  const content = fs.readFileSync(envPath, "utf-8");
  const env = {};
  content.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      env[match[1]] = value.trim();
    }
  });
  return env;
}

async function run() {
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log("==========================================");
  console.log("       STUDYSYNC DATABASE AUDIT           ");
  console.log("==========================================");

  // 1. Fetch Auth Users
  console.log("Fetching auth.users...");
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Error fetching auth users:", authError.message);
    return;
  }
  const authUsers = authData.users || [];
  console.log(`Found ${authUsers.length} users in auth.users.`);

  // 2. Fetch Profiles
  console.log("Fetching profiles...");
  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*");
  if (profilesError) {
    console.error("Error fetching profiles:", profilesError.message);
    return;
  }
  console.log(`Found ${profiles.length} profiles.`);

  // 3. Match Profiles to Auth Users
  const authUserMap = new Map(authUsers.map((u) => [u.id, u]));
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const missingProfiles = [];
  authUsers.forEach((u) => {
    if (!profileMap.has(u.id)) {
      missingProfiles.push(u);
    }
  });

  const profilesWithoutAuth = [];
  profiles.forEach((p) => {
    if (!authUserMap.has(p.id)) {
      profilesWithoutAuth.push(p);
    }
  });

  console.log("\n--- PROFILE INTEGRITY ---");
  if (missingProfiles.length > 0) {
    console.log(`⚠️  WARNING: ${missingProfiles.length} auth.users do not have a profiles record!`);
    missingProfiles.forEach((u) => {
      console.log(`  - User ID: ${u.id} | Email: ${u.email} | Created At: ${u.created_at}`);
    });
  } else {
    console.log("✅ All auth.users have matching profiles.");
  }

  if (profilesWithoutAuth.length > 0) {
    console.log(`⚠️  WARNING: ${profilesWithoutAuth.length} profiles do not have matching auth.users records!`);
    profilesWithoutAuth.forEach((p) => {
      console.log(`  - Profile ID: ${p.id} | Email: ${p.email}`);
    });
  }

  // 4. Audit Table FK Constraints & Orphaned Rows
  const tables = [
    { name: "todos", refColumn: "user_id" },
    { name: "study_sessions", refColumn: "user_id" },
    { name: "session_segments", refColumn: "user_id" },
    { name: "friend_requests", refColumn: "requester_id", altRefColumn: "requested_id" },
    { name: "friendships", refColumn: "user_a", altRefColumn: "user_b" },
  ];

  console.log("\n--- FOREIGN KEY AUDIT ---");
  for (const table of tables) {
    console.log(`Auditing table "${table.name}"...`);
    const { data: rows, error: rowError } = await supabase.from(table.name).select("*");
    if (rowError) {
      console.error(`  Error reading ${table.name}:`, rowError.message);
      continue;
    }

    let brokenCount = 0;
    rows.forEach((row) => {
      const val1 = row[table.refColumn];
      const val2 = table.altRefColumn ? row[table.altRefColumn] : null;

      const p1Exists = profileMap.has(val1);
      const p2Exists = val2 ? profileMap.has(val2) : true;

      if (!p1Exists || !p2Exists) {
        brokenCount++;
        console.log(`  ❌ Orphaned row in "${table.name}" (ID: ${row.id}):`);
        if (!p1Exists) {
          console.log(`     - Column "${table.refColumn}" references non-existent profile: ${val1}`);
        }
        if (!p2Exists) {
          console.log(`     - Column "${table.altRefColumn}" references non-existent profile: ${val2}`);
        }
      }
    });

    if (brokenCount === 0) {
      console.log(`  ✅ Table "${table.name}" has no orphaned/broken rows (checked ${rows.length} rows).`);
    } else {
      console.log(`  ⚠️  Table "${table.name}" has ${brokenCount} orphaned/broken rows.`);
    }
  }

  console.log("==========================================");
}

run().catch((err) => {
  console.error("Fatal error:", err.message);
});
