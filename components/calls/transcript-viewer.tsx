"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function TranscriptViewer({ transcript }: { transcript: string }) {
  return (
    <Card className="rounded-xl border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Transcript</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[min(28rem,55vh)] rounded-lg border border-border/60 bg-muted/20 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {transcript}
          </p>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
