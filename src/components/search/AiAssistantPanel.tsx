"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, Send, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { trackSearchEvent } from "@/lib/analytics";

interface AiAssistantPanelProps {
  query: string;
  onSearch: (query: string) => void;
  onClear: () => void;
  isSearching?: boolean;
}

export default function AiAssistantPanel({ query, onSearch, onClear, isSearching }: AiAssistantPanelProps) {
  const [input, setInput] = useState(query);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [hasSpeechApi, setHasSpeechApi] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSpeechError("Voice search is not supported in this browser.");
      return;
    }

    setHasSpeechApi(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      const trimmed = transcript.trim();
      if (trimmed) {
        trackSearchEvent({
          event: "search_started",
          query: trimmed,
        });
        onSearch(trimmed);
      }
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setSpeechError("Could not recognize speech. Please try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [onSearch]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    trackSearchEvent({
      event: "search_started",
      query: trimmed,
    });
    onSearch(trimmed);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-sm">🤖</span>
        </div>
        <div>
          <h3 className="font-semibold text-text text-sm">AI Assistant</h3>
          <p className="text-xs text-text-muted">Tell us what service you need</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., I need a plumber near me today"
          className="w-full pl-4 pr-20 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 text-text placeholder:text-text-muted text-sm"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {input && (
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {hasSpeechApi && !speechError && (
            <button
              type="button"
              onClick={toggleListening}
              className={`p-1.5 rounded-lg transition-colors ${
                isListening
                  ? "text-danger bg-danger/10"
                  : "text-text-muted hover:text-primary hover:bg-primary/5"
              }`}
              aria-label={isListening ? "Stop listening" : "Start voice search"}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSearching}
            leftIcon={isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          >
            Search
          </Button>
        </div>
      </form>

      {isListening && (
        <div className="mt-3 flex items-center gap-2 text-sm text-danger">
          <div className="w-2 h-2 bg-danger rounded-full animate-pulse" />
          Listening... Speak now
        </div>
      )}

      {speechError && (
        <p className="mt-2 text-xs text-text-muted">{speechError}</p>
      )}

      <div className="mt-4">
        <p className="text-xs text-text-muted mb-2">Try:</p>
        <div className="flex flex-wrap gap-2">
          {["Plumber near me", "AC repair today", "Electrician within 5 km", "Painter in Mathura"].map((example) => (
            <button
              key={example}
              onClick={() => {
                setInput(example);
                const trimmed = example.trim();
                if (trimmed) {
                  trackSearchEvent({
                    event: "search_started",
                    query: trimmed,
                  });
                  onSearch(trimmed);
                }
              }}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 text-text-muted text-xs rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

