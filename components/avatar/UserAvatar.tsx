import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { accentForUserId, avatarForId } from "@/lib/avatars";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/stores/useUserStore";

type UserAvatarProps = {
  profile: Pick<UserProfile, "id" | "initials" | "avatar_id" | "full_name">;
  className?: string;
};

export function UserAvatar({ profile, className }: UserAvatarProps) {
  const avatar = avatarForId(profile.avatar_id);

  return (
    <Avatar className={cn("h-10 w-10 ring-1", accentForUserId(profile.id), className)}>
      <AvatarFallback className={cn("text-sm font-bold", accentForUserId(profile.id))}>
        {avatar ? <span className="text-lg leading-none">{avatar.emoji}</span> : profile.initials || profile.full_name.slice(0, 1) || "U"}
      </AvatarFallback>
    </Avatar>
  );
}
