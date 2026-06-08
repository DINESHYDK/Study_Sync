"use client";

import { UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFriends } from "@/hooks/useFriends";

type AddFriendDialogProps = {
  triggerLabel?: string;
};

export function AddFriendDialog({ triggerLabel = "Add Friend" }: AddFriendDialogProps) {
  const { addFriendByCode } = useFriends();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const result = await addFriendByCode(code);
    setSubmitting(false);

    if (result) {
      setError(result);
      return;
    }

    setCode("");
    setError(null);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a friend</DialogTitle>
          <DialogDescription>Paste their 8-character referral code.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Input
            autoCapitalize="characters"
            maxLength={12}
            onChange={(event) => setCode(event.target.value)}
            placeholder="ABCD1234"
            value={code}
          />
          {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-red-100">{error}</p> : null}
          <DialogFooter>
            <Button onClick={() => setOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Sending..." : "Send request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
