/**
 * Web Speech API helpers for "Record Answer" simulation.
 * Gracefully degrades when SpeechRecognition is unavailable.
 */

// Minimal typing for browser SpeechRecognition (not in all TS libs)
type AnyRec = {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
}

interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as AnyRec;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

export interface SpeechRecorder {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export function createSpeechRecorder(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError?: (message: string) => void
): SpeechRecorder | null {
  if (!isSpeechRecognitionSupported()) return null;

  const w = window as unknown as AnyRec;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SR) return null;
  const recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event: SpeechResultEvent) => {
    let interim = "";
    let final = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += transcript;
      else interim += transcript;
    }
    if (final) onResult(final, true);
    else if (interim) onResult(interim, false);
  };

  recognition.onerror = (event: { error?: string }) => {
    onError?.(event.error || "Speech recognition error");
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch {
        // already started
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
    abort: () => {
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
    },
  };
}

export function speakText(text: string, onEnd?: () => void): void {
  if (!isSpeechSynthesisSupported()) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = 1;
  utter.onend = () => onEnd?.();
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
