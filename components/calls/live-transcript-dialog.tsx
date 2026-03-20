"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Captions } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildSyntheticTranscriptTurns } from "@/lib/synthetic-transcript-turns";
import type { CallDocument } from "@/types/call";
import type { TranscriptTurn } from "@/types/transcript-turn";

function speakerLabel(
  call: CallDocument,
  speaker: "sales_rep" | "customer",
): string {
  if (speaker === "sales_rep") {
    const n = call.analysis.sales_rep_name.trim();
    return n || "Sales rep";
  }
  const n = call.analysis.customer_name.trim();
  return n || "Customer";
}

function LiveLine({ turn, call }: { turn: TranscriptTurn; call: CallDocument }) {
  const label = speakerLabel(call, turn.speaker);
  return (
    <div className="border-primary/35 bg-primary/8 rounded-xl border px-4 py-4 shadow-sm transition-all duration-200">
      <p className="text-foreground text-base font-semibold">{label}:</p>
      <p className="text-foreground mt-2 text-base leading-relaxed sm:text-lg">
        {turn.text}
      </p>
    </div>
  );
}

export function LiveTranscriptDialog({
  call,
  audioUrl,
  pageAudioRef,
}: {
  call: CallDocument;
  audioUrl: string;
  pageAudioRef: RefObject<HTMLAudioElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const dialogAudioRef = useRef<HTMLAudioElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const detachAudioListenersRef = useRef<(() => void) | null>(null);

  const effectiveTurns = useMemo((): TranscriptTurn[] => {
    if (call.transcriptTurns.length > 0) {
      return call.transcriptTurns;
    }
    return buildSyntheticTranscriptTurns(
      call.transcript,
      call.durationSeconds,
    );
  }, [call]);

  const hasTurns = effectiveTurns.length > 0;
  const usesSyntheticTiming =
    call.transcriptTurns.length === 0 && hasTurns;

  const computeActiveIndex = useCallback(
    (audio: HTMLAudioElement, turns: TranscriptTurn[]) => {
      const t = audio.currentTime;
      let idx: number | null = null;
      for (let i = turns.length - 1; i >= 0; i--) {
        if (t >= turns[i].start) {
          idx = i;
          break;
        }
      }
      setActiveIndex((prev) => (prev === idx ? prev : idx));
    },
    [],
  );

  const attachAudioListeners = useCallback(
    (node: HTMLAudioElement | null) => {
      detachAudioListenersRef.current?.();
      detachAudioListenersRef.current = null;
      dialogAudioRef.current = node;

      if (!node || !open || !hasTurns) {
        return;
      }

      const turns = effectiveTurns;
      let raf = 0;

      const sync = () => computeActiveIndex(node, turns);

      const loop = () => {
        sync();
        if (!node.paused) {
          raf = requestAnimationFrame(loop);
        }
      };

      const onPlay = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      };

      const onPause = () => {
        cancelAnimationFrame(raf);
        sync();
      };

      node.addEventListener("play", onPlay);
      node.addEventListener("pause", onPause);
      node.addEventListener("seeked", sync);
      node.addEventListener("ended", onPause);
      node.addEventListener("timeupdate", sync);

      sync();
      if (!node.paused) {
        onPlay();
      }

      detachAudioListenersRef.current = () => {
        cancelAnimationFrame(raf);
        node.removeEventListener("play", onPlay);
        node.removeEventListener("pause", onPause);
        node.removeEventListener("seeked", sync);
        node.removeEventListener("ended", onPause);
        node.removeEventListener("timeupdate", sync);
      };
    },
    [open, hasTurns, effectiveTurns, computeActiveIndex],
  );

  useEffect(() => {
    if (!open) {
      detachAudioListenersRef.current?.();
      detachAudioListenersRef.current = null;
      dialogAudioRef.current = null;
      setActiveIndex(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      const page = pageAudioRef.current;
      const dialog = dialogAudioRef.current;
      if (page && dialog) {
        dialog.currentTime = page.currentTime;
        if (hasTurns) {
          computeActiveIndex(dialog, effectiveTurns);
        }
      }
    });
    return () => cancelAnimationFrame(id);
  }, [
    open,
    pageAudioRef,
    hasTurns,
    effectiveTurns,
    computeActiveIndex,
  ]);

  const activeTurn =
    activeIndex !== null && activeIndex >= 0
      ? effectiveTurns[activeIndex]
      : null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full rounded-lg sm:w-auto"
        onClick={() => setOpen(true)}
      >
        <Captions className="size-4 sm:mr-2" />
        <span className="hidden sm:inline">Live transcript</span>
        <span className="sm:hidden">Live</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[min(92vh,880px)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[min(88vh,840px)]">
          <div className="border-border/80 border-b px-6 pt-6 pr-14 pb-4">
            <DialogHeader>
              <DialogTitle>Live transcript</DialogTitle>
              <DialogDescription>
                {hasTurns ? (
                  usesSyntheticTiming ? (
                    <>
                      Timing is estimated from the text (this call was saved
                      before precise timestamps). Re-upload the recording for
                      Whisper-synced lines. Playback still highlights by time.
                    </>
                  ) : (
                    <>
                      Only whoever is speaking right now is shown — it updates
                      as the audio plays (use the player in this window).
                    </>
                  )
                ) : (
                  "No transcript text is available for this call."
                )}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="grid min-h-0 flex-1 gap-4 overflow-hidden px-6 py-4 lg:grid-cols-2 lg:gap-6">
            <div className="flex min-h-0 flex-col gap-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Recording
              </p>
              <audio
                ref={attachAudioListeners}
                className="w-full rounded-lg outline-none"
                controls
                preload="metadata"
                src={audioUrl}
              >
                Your browser does not support audio playback.
              </audio>
            </div>
            <div className="flex min-h-[240px] flex-col justify-center gap-3 lg:min-h-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Dialogue — live
              </p>
              {hasTurns ? (
                <div className="flex min-h-[200px] flex-col justify-center">
                  {activeTurn ? (
                    <LiveLine
                      key={`cur-${activeIndex}-${activeTurn.start}`}
                      turn={activeTurn}
                      call={call}
                    />
                  ) : (
                    <div className="text-muted-foreground rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center text-sm leading-relaxed">
                      Press play on the recording above — the active speaker
                      line appears here and follows playback.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground max-h-[320px] overflow-y-auto rounded-xl border border-border/80 bg-muted/15 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {call.transcript || "—"}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
