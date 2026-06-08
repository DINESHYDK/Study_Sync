"use client";

import { Check, Copy, KeyRound, Trash2, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { UserAvatar } from "@/components/avatar/UserAvatar";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AVATARS } from "@/lib/avatars";
import { appUrl, computeInitials } from "@/lib/utils";
import { useFriends } from "@/hooks/useFriends";
import { useFriendStore } from "@/stores/useFriendStore";
import { useUserStore } from "@/stores/useUserStore";

export default function SettingsPage() {
  const router = useRouter();
  const { supabase, isConfigured } = useSupabase();
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const incomingRequests = useFriendStore((state) => state.incomingRequests);
  const { addFriendByCode, acceptRequest, declineRequest } = useFriends();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [friendCode, setFriendCode] = useState("");
  const [friendError, setFriendError] = useState<string | null>(null);
  const [isSavingName, setSavingName] = useState(false);
  const [isUpdatingAvatar, setUpdatingAvatar] = useState(false);
  const [isAddingFriend, setAddingFriend] = useState(false);
  const [processingRequestIds, setProcessingRequestIds] = useState<string[]>([]);
  const [isResettingPassword, setResettingPassword] = useState(false);
  const [isDeletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  if (!profile) {
    return <div className="text-sm text-muted-foreground">Loading settings...</div>;
  }

  const currentProfile = profile;

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = fullName.trim();

    if (!normalizedName) {
      return;
    }

    const initials = computeInitials(normalizedName);
    updateProfile({ full_name: normalizedName, initials });

    if (!isConfigured) {
      toast.success("Profile updated locally.");
      return;
    }

    if (currentProfile.referral_code === "PENDING") {
      toast.error("Your user profile is missing from the database. Please make sure the profiles table is configured.");
      return;
    }

    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: normalizedName, initials })
      .eq("id", currentProfile.id);
    setSavingName(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Profile updated.");
  }

  async function selectAvatar(avatarId: string | null) {
    if (isUpdatingAvatar) return;
    setUpdatingAvatar(true);
    updateProfile({ avatar_id: avatarId });

    if (!isConfigured) {
      setUpdatingAvatar(false);
      return;
    }

    if (currentProfile.referral_code === "PENDING") {
      toast.error("Your user profile is missing from the database. Please make sure the profiles table is configured.");
      setUpdatingAvatar(false);
      return;
    }

    const { error } = await supabase.from("profiles").update({ avatar_id: avatarId }).eq("id", currentProfile.id);

    if (error) {
      toast.error(error.message);
      if (profile) {
        updateProfile({ avatar_id: profile.avatar_id });
      }
    }
    setUpdatingAvatar(false);
  }

  async function copyReferralCode() {
    await navigator.clipboard.writeText(currentProfile.referral_code);
    toast.success("Code copied!");
  }

  async function sendFriendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isAddingFriend) return;
    setAddingFriend(true);
    const result = await addFriendByCode(friendCode);
    setAddingFriend(false);

    if (result) {
      setFriendError(result);
      return;
    }

    setFriendCode("");
    setFriendError(null);
  }

  async function handleAccept(requestId: string) {
    if (processingRequestIds.includes(requestId)) return;
    setProcessingRequestIds((prev) => [...prev, requestId]);
    await acceptRequest(requestId);
    setProcessingRequestIds((prev) => prev.filter((id) => id !== requestId));
  }

  async function handleDecline(requestId: string) {
    if (processingRequestIds.includes(requestId)) return;
    setProcessingRequestIds((prev) => [...prev, requestId]);
    await declineRequest(requestId);
    setProcessingRequestIds((prev) => prev.filter((id) => id !== requestId));
  }

  async function sendPasswordReset() {
    if (!isConfigured) {
      toast.info("Configure Supabase before sending password reset emails.");
      return;
    }

    if (isResettingPassword) return;
    setResettingPassword(true);

    const { error } = await supabase.auth.resetPasswordForEmail(currentProfile.email, {
      redirectTo: `${appUrl()}/auth/update-password`,
    });

    setResettingPassword(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password reset email sent.");
  }

  async function deleteAccount() {
    const confirmed = window.confirm("Delete your StudySync account and all associated data?");

    if (!confirmed) {
      return;
    }

    if (isDeletingAccount) return;
    setDeletingAccount(true);

    const response = await fetch("/api/account/delete", { method: "POST" });

    if (!response.ok) {
      toast.error("Could not delete account.");
      setDeletingAccount(false);
      return;
    }

    if (isConfigured) {
      await supabase.auth.signOut();
    }

    setDeletingAccount(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-normal">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Profile, referral codes, incoming requests, and account controls.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="flex items-center gap-4">
            <UserAvatar className="h-14 w-14" profile={profile} />
            <div>
              <p className="font-semibold">{profile.full_name || "StudySync User"}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={saveName}>
            <Input disabled={isSavingName} onChange={(event) => setFullName(event.target.value)} value={fullName} />
            <Button disabled={isSavingName} type="submit">
              <Check className="h-4 w-4" />
              {isSavingName ? "Saving..." : "Save"}
            </Button>
          </form>
          <div className="grid gap-3">
            <p className="text-sm font-semibold">Avatar</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              <button
                className={`rounded-xl border p-3 text-sm transition ${
                  profile.avatar_id === null ? "border-violet-400 bg-violet-500/10" : "border-border bg-secondary"
                }`}
                disabled={isUpdatingAvatar}
                onClick={() => void selectAvatar(null)}
                type="button"
              >
                None
              </button>
              {AVATARS.map((avatar) => (
                <button
                  className={`rounded-xl border p-3 text-center transition hover:border-violet-400 ${
                    profile.avatar_id === avatar.id ? "border-violet-400 bg-violet-500/10" : "border-border bg-secondary"
                  }`}
                  disabled={isUpdatingAvatar}
                  key={avatar.id}
                  onClick={() => void selectAvatar(avatar.id)}
                  type="button"
                >
                  <span className="block text-2xl">{avatar.emoji}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{avatar.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="rounded-2xl border border-border bg-secondary p-4 font-mono text-3xl font-semibold tracking-widest">
            {profile.referral_code}
          </div>
          <Button onClick={() => void copyReferralCode()} variant="outline">
            <Copy className="h-4 w-4" />
            Copy
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a Friend</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={sendFriendRequest}>
            <Input
              autoCapitalize="characters"
              disabled={isAddingFriend}
              onChange={(event) => setFriendCode(event.target.value)}
              placeholder="Paste referral code"
              value={friendCode}
            />
            <Button disabled={isAddingFriend} type="submit">
              <UserPlus className="h-4 w-4" />
              {isAddingFriend ? "Adding..." : "Add Friend"}
            </Button>
          </form>
          {friendError ? <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-red-100">{friendError}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Friend Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {incomingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No incoming requests.</p>
          ) : (
            <div className="grid gap-3">
              {incomingRequests.map((request) => (
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary p-3 sm:flex-row sm:items-center sm:justify-between" key={request.id}>
                  <div className="flex items-center gap-3">
                    {request.requester ? <UserAvatar profile={request.requester} /> : null}
                    <div>
                      <p className="font-semibold">{request.requester?.full_name ?? "StudySync user"}</p>
                      <p className="text-xs text-muted-foreground">{request.requester?.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      disabled={processingRequestIds.includes(request.id)} 
                      onClick={() => void handleAccept(request.id)} 
                      size="sm" 
                      variant="success"
                    >
                      {processingRequestIds.includes(request.id) ? "Accepting..." : "Accept"}
                    </Button>
                    <Button 
                      disabled={processingRequestIds.includes(request.id)} 
                      onClick={() => void handleDecline(request.id)} 
                      size="sm" 
                      variant="ghost"
                    >
                      {processingRequestIds.includes(request.id) ? "Declining..." : "Decline"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button disabled={isResettingPassword} onClick={() => void sendPasswordReset()} variant="outline">
            <KeyRound className="h-4 w-4" />
            {isResettingPassword ? "Sending..." : "Change Password"}
          </Button>
          <Button disabled={isDeletingAccount} onClick={() => void deleteAccount()} variant="destructive">
            <Trash2 className="h-4 w-4" />
            {isDeletingAccount ? "Deleting..." : "Delete Account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
