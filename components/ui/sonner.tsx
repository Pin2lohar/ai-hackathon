"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

/** Avoid useTheme() here — it differs SSR vs client and causes hydration errors. */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      position="top-right"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast rounded-xl border border-gray-200/80 bg-white text-gray-800 shadow-lg backdrop-blur-sm transition-all duration-200 ease-in-out animate-in slide-in-from-right-8 fade-in-0 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100",
          success: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300",
          error: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300",
          warning: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-200",
          info: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200",
          description: "text-current/85",
          title: "font-medium",
          closeButton: "border-current/20 hover:bg-black/5 dark:hover:bg-white/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
