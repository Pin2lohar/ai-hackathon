"use client";

import { forwardRef, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AudioPlayerCard = forwardRef<
  HTMLAudioElement,
  {
    title: string;
    audioUrl: string;
    footer?: ReactNode;
  }
>(function AudioPlayerCard({ title, audioUrl, footer }, ref) {
  return (
    <Card className="rounded-xl border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Recording</CardTitle>
        <p className="text-muted-foreground truncate text-sm">{title}</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <audio
          ref={ref}
          className="w-full rounded-lg outline-none"
          controls
          preload="metadata"
          src={audioUrl}
        >
          Your browser does not support audio playback.
        </audio>
        {footer}
      </CardContent>
    </Card>
  );
});

AudioPlayerCard.displayName = "AudioPlayerCard";
