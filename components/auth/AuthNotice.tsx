import { AlertTriangle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function AuthNotice() {
  return (
    <Card className="border-amber-500/30 bg-amber-500/10">
      <CardContent className="flex gap-3 p-4 text-sm text-amber-100">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Supabase environment variables are not configured yet. The protected app opens in demo mode, while auth forms
          wait for real keys in `.env.local`.
        </p>
      </CardContent>
    </Card>
  );
}
