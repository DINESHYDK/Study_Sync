export type AvatarOption = {
  id: string;
  url: string;
  label: string;
};

export const AVATARS = [
  { id: "explorer", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=explorer", label: "Explorer" },
  { id: "scholar", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=scholar", label: "Scholar" },
  { id: "coder", url: "https://api.dicebear.com/7.x/bottts/svg?seed=coder", label: "Coder" },
  { id: "creator", url: "https://api.dicebear.com/7.x/croodles/svg?seed=creator", label: "Creator" },
  { id: "artist", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=artist", label: "Artist" },
  { id: "gamer", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer", label: "Gamer" },
  { id: "cyborg", url: "https://api.dicebear.com/7.x/bottts/svg?seed=cyborg", label: "Cyborg" },
  { id: "ninja", url: "https://api.dicebear.com/7.x/bottts/svg?seed=ninja", label: "Ninja" },
  { id: "hero", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=hero", label: "Hero" },
  { id: "chef", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=chef", label: "Chef" },
  { id: "space", url: "https://api.dicebear.com/7.x/bottts/svg?seed=space", label: "Astronaut" },
  { id: "pixel", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=pixel", label: "Retro" },
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
