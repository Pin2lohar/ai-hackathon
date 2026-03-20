"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CallRef = { _id: string; originalFilename: string };

export function DeleteCallDialog({
  call,
  open,
  onOpenChange,
  onDeleted,
}: {
  call: CallRef | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Runs after a successful DELETE with the removed id. */
  onDeleted: (deletedId: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = useCallback(async () => {
    if (!call) return;
    const id = call._id;
    setDeleting(true);
    try {
      const res = await fetch(`/api/calls/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Could not delete call");
      }
      toast.success("Call removed from your library.");
      onDeleted(id);
      onOpenChange(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Delete failed";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }, [call, onDeleted, onOpenChange]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (deleting && !next) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this call?</DialogTitle>
          <DialogDescription>
            This removes{" "}
            <span className="font-medium text-foreground">
              {call?.originalFilename ?? "the call"}
            </span>{" "}
            from your library and deletes the stored audio file. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleting}
            onClick={() => void confirmDelete()}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
