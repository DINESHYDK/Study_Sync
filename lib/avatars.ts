export type AvatarOption = {
  id: string;
  emoji: string;
  label: string;
};

export const AVATARS = [
  { id: "fox", emoji: "🦊", label: "Fox" },
  { id: "rocket", emoji: "🚀", label: "Rocket" },
  { id: "owl", emoji: "🦉", label: "Owl" },
  { id: "dragon", emoji: "🐉", label: "Dragon" },
  { id: "robot", emoji: "🤖", label: "Robot" },
  { id: "ninja", emoji: "🥷", label: "Ninja" },
  { id: "astronaut", emoji: "👨‍🚀", label: "Astronaut" },
  { id: "wizard", emoji: "🧙", label: "Wizard" },
  { id: "panda", emoji: "🐼", label: "Panda" },
  { id: "tiger", emoji: "🐯", label: "Tiger" },
  { id: "phoenix", emoji: "🔥", label: "Phoenix" },
  { id: "ghost", emoji: "👻", label: "Ghost" },
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
