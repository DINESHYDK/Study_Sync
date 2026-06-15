export type AvatarOption = {
  id: string;
  url: string;
  label: string;
};

export const AVATARS = [
  { id: "micah-felix", url: "https://api.dicebear.com/9.x/micah/svg?seed=Felix&backgroundColor=transparent", label: "Chintu" },
  { id: "avataaars-aiden", url: "https://api.dicebear.com/9.x/avataaars/svg?seed=Aiden&backgroundColor=transparent", label: "Pappu" },
  { id: "notionists-jude", url: "https://api.dicebear.com/9.x/notionists/svg?seed=Jude&backgroundColor=transparent", label: "Bujji" },
  { id: "miniavs-amaya", url: "https://api.dicebear.com/9.x/miniavs/svg?seed=Amaya&backgroundColor=transparent", label: "Ammu" },
  { id: "micah-oliver", url: "https://api.dicebear.com/9.x/micah/svg?seed=Oliver&backgroundColor=transparent", label: "Kanna" },
  { id: "avataaars-sophia", url: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sophia&backgroundColor=transparent", label: "Chitti" },
  { id: "notionists-liam", url: "https://api.dicebear.com/9.x/notionists/svg?seed=Liam&backgroundColor=transparent", label: "Raju" },
  { id: "miniavs-emma", url: "https://api.dicebear.com/9.x/miniavs/svg?seed=Emma&backgroundColor=transparent", label: "Guddu" },
  { id: "micah-noah", url: "https://api.dicebear.com/9.x/micah/svg?seed=Noah&backgroundColor=transparent", label: "Munna" },
  { id: "avataaars-bella", url: "https://api.dicebear.com/9.x/avataaars/svg?seed=Isabella&backgroundColor=transparent", label: "Pinky" },
  { id: "notionists-james", url: "https://api.dicebear.com/9.x/notionists/svg?seed=James&backgroundColor=transparent", label: "Sonu" },
  { id: "miniavs-mia", url: "https://api.dicebear.com/9.x/miniavs/svg?seed=Mia&backgroundColor=transparent", label: "Chinnu" },
] as const satisfies readonly AvatarOption[];

export const AVATAR_ACCENTS = [
  "bg-violet-500/20 text-violet-100 ring-violet-400/40",
  "bg-emerald-500/20 text-emerald-100 ring-emerald-400/40",
  "bg-cyan-500/20 text-cyan-100 ring-cyan-400/40",
  "bg-amber-500/20 text-amber-100 ring-amber-400/40",
  "bg-rose-500/20 text-rose-100 ring-rose-400/40",
  "bg-fuchsia-500/20 text-fuchsia-100 ring-fuchsia-400/40",
  "bg-sky-500/20 text-sky-100 ring-sky-400/40",
  "bg-lime-500/20 text-lime-100 ring-lime-400/40",
] as const;

export function avatarForId(avatarId: string | null) {
  if (!avatarId) {
    return null;
  }

  return AVATARS.find((avatar) => avatar.id === avatarId) ?? null;
}

export function accentForUserId(userId: string) {
  let hash = 0;

  for (const character of userId) {
    hash = (hash * 31 + character.charCodeAt(0)) % AVATAR_ACCENTS.length;
  }

  return AVATAR_ACCENTS[Math.abs(hash) % AVATAR_ACCENTS.length];
}
