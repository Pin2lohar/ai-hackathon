"use client";

import * as React from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

function Dialog({ ...props }: BaseDialog.Root.Props) {
  return <BaseDialog.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: BaseDialog.Trigger.Props) {
  return <BaseDialog.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: BaseDialog.Portal.Props) {
  return <BaseDialog.Portal data-slot="dialog-portal" {...props} />;
}

function DialogBackdrop({
  className,
  ...props
}: BaseDialog.Backdrop.Props) {
  return (
    <BaseDialog.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 z-40 bg-black/40 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

function DialogViewport({
  className,
  ...props
}: BaseDialog.Viewport.Props) {
  return (
    <BaseDialog.Viewport
      data-slot="dialog-viewport"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 outline-none sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

function DialogPopup({
  className,
  children,
  ...props
}: BaseDialog.Popup.Props) {
  return (
    <BaseDialog.Popup
      data-slot="dialog-popup"
      className={cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 relative z-50 mx-auto grid w-full max-w-5xl translate-x-0 translate-y-0 gap-4 rounded-2xl border border-border/80 bg-background/95 p-4 shadow-xl duration-200 outline-none sm:p-6",
        className,
      )}
      {...props}
    >
      {children}
    </BaseDialog.Popup>
  );
}

function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 text-left", className)}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: BaseDialog.Title.Props) {
  return (
    <BaseDialog.Title
      data-slot="dialog-title"
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: BaseDialog.Description.Props) {
  return (
    <BaseDialog.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function DialogClose({
  className,
  ...props
}: BaseDialog.Close.Props) {
  return (
    <BaseDialog.Close
      data-slot="dialog-close"
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "absolute top-3 right-3 rounded-lg",
        className,
      )}
      {...props}
    >
      <X className="size-4" />
      <span className="sr-only">Close</span>
    </BaseDialog.Close>
  );
}

function DialogContent({
  className,
  children,
  ...props
}: BaseDialog.Popup.Props) {
  return (
    <DialogPortal>
      <DialogBackdrop />
      <DialogViewport>
        <DialogPopup className={className} {...props}>
          <DialogClose />
          {children}
        </DialogPopup>
      </DialogViewport>
    </DialogPortal>
  );
}

export {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DialogViewport,
};
