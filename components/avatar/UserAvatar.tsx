import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    <Avatar className={cn("h-10 w-10 ring-1 bg-background", accentForUserId(profile.id), className)}>
      {avatar?.url ? (
        <AvatarImage
          src={avatar.url}
          alt={avatar.label}
          className="object-cover"
        />
      ) : null}
      <AvatarFallback className={cn("text-sm font-bold", accentForUserId(profile.id))}>
        {profile.initials || profile.full_name?.slice(0, 1) || "U"}
      </AvatarFallback>
    </Avatar>
  );
}
