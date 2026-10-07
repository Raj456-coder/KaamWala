"use client";

import { useState } from "react";
import {
  Mic,
  MicOff,
  Loader2,
  Send,
  X,
  Sparkles,
  Volume2,
  HelpCircle,
  MapPin,
  Clock,
  IndianRupee,
  Briefcase,
  Globe,
  Radio,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { trackSearchEvent } from "@/lib/analytics";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { ExtractedIntent, ClarificationOption, SessionContext } from "@/lib/ai/types";

interface AiAssistantPanelProps {
  query: string;
  onSearch: (query: string, contextOverride?: SessionContext) => void;
  onClear: () => void;
  isSearching?: boolean;
  extractedIntent?: ExtractedIntent | null;
  replyMessage?: string | null;
  clarificationOptions?: ClarificationOption[] | null;
  onSelectClarification?: (option: ClarificationOption) => void;
  onClearEntity?: (entityKey: "service" | "location" | "urgency" | "budget") => void;
  userCity?: string | null;
}

const SAMPLE_PROMPTS = [
  { label: "🔨 मुझे carpenter चाहिए", query: "mujhe carpenter chahiye" },
  { label: "⚡ बिजली वाला Mathura me", query: "bijli wala Mathura me" },
  { label: "🚰 Pipe leak plumber bhejo", query: "pipe leak ho gaya plumber bhejo" },
  { label: "❄️ AC wala jo abhi aa sake", query: "AC wala chahiye jo abhi available ho" },
  { label: "🧹 Kaamwali bai 500 ke andar", query: "kaamwali bai 500 ke andar" },
  { label: "🧱 Mistri chahiye", query: "mistri chahiye" },
];

export default function AiAssistantPanel({
  query,
  onSearch,
  onClear,
  isSearching,
  extractedIntent,
  replyMessage,
  clarificationOptions,
  onSelectClarification,
  onClearEntity,
  userCity,
}: AiAssistantPanelProps) {
  const [input, setInput] = useState(query);
  const [prevQuery, setPrevQuery] = useState(query);
  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("hi-IN");

  if (query !== prevQuery) {
    setPrevQuery(query);
    setInput(query);
  }

  const {
    isListening,
    isSupported,
    interimTranscript,
    error: voiceError,
    startListening,
    stopListening,
    cancelListening,
  } = useVoiceAssistant({
    language: voiceLang,
    onFinalTranscript: (finalText) => {
      setInput(finalText);
      trackSearchEvent({
        event: "search_started",
        query: finalText,
      });
      onSearch(finalText);
    },
  });

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

  const handlePromptClick = (promptQuery: string) => {
    setInput(promptQuery);
    trackSearchEvent({
      event: "search_started",
      query: promptQuery,
    });
    onSearch(promptQuery);
  };

  const entities = extractedIntent?.extractedEntities;

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-850 dark:to-slate-900 rounded-3xl border border-primary/20 shadow-lg shadow-primary/5 p-6 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-md shadow-primary/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-text text-base">KaamWala AI Khoj & Bolkar Khojein</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Hindi / Hinglish / Vernacular
              </span>
            </div>
            <p className="text-xs text-text-muted">
              Apni zaroorat aam bolchal ki bhasha me likhein ya bolkar batayein
            </p>
          </div>
        </div>

        {/* Voice Language Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <Globe className="w-3.5 h-3.5 text-text-muted ml-1" />
          <button
            type="button"
            onClick={() => setVoiceLang("hi-IN")}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              voiceLang === "hi-IN"
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            हिन्दी
          </button>
          <button
            type="button"
            onClick={() => setVoiceLang("en-IN")}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              voiceLang === "en-IN"
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Main Search Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              voiceLang === "hi-IN"
                ? "उदा: मुझे मथुरा में बढ़ई चाहिए, 500 के अंदर..."
                : "e.g., mujhe Mathura me carpenter chahiye, 500 ke andar..."
            }
            className="w-full pl-4 pr-32 py-3.5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 text-text placeholder:text-text-muted/60 text-sm font-medium shadow-inner transition-all"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {input && (
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  onClear();
                }}
                className="p-1.5 text-text-muted hover:text-text rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {isSupported && (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-2.5 rounded-xl transition-all flex items-center gap-1 font-medium text-xs ${
                  isListening
                    ? "bg-danger text-white shadow-lg shadow-danger/30 animate-pulse"
                    : "bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105"
                }`}
                title={isListening ? "Stop listening" : "Speak your requirement"}
                aria-label={isListening ? "Stop listening" : "Start voice search"}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Rokein</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span className="hidden sm:inline">Boliye</span>
                  </>
                )}
              </button>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSearching}
              className="rounded-xl px-4 py-2"
              leftIcon={
                isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )
              }
            >
              Khojein
            </Button>
          </div>
        </div>
      </form>

      {/* Voice Listening Waveform & Interim Transcription */}
      {isListening && (
        <div className="mt-3 p-3 bg-danger/5 border border-danger/20 rounded-2xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-danger"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-danger flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-spin" />
                {voiceLang === "hi-IN" ? "सुन रहा हूँ... बोलिए" : "Listening... Speak your requirement"}
              </span>
              {interimTranscript && (
                <span className="text-xs text-text-secondary italic mt-0.5">
                  &ldquo;{interimTranscript}&rdquo;
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={cancelListening}
            className="text-xs text-text-muted hover:text-danger px-2 py-1 rounded hover:bg-danger/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Voice Error notice */}
      {voiceError && (
        <div className="mt-2 text-xs text-danger bg-danger/5 border border-danger/20 px-3 py-1.5 rounded-xl">
          {voiceError}
        </div>
      )}

      {/* Natural AI Assistant Conversational Bubble & Clarification */}
      {(replyMessage || clarificationOptions?.length) && (
        <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/15 shadow-sm space-y-3">
          {replyMessage && (
            <div className="flex items-start gap-2.5">
              <Volume2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-text font-medium leading-relaxed">
                {replyMessage}
              </div>
            </div>
          )}

          {/* Ambiguity Clarification Options */}
          {clarificationOptions && clarificationOptions.length > 0 && (
            <div className="pt-2 border-t border-primary/10">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Kripya sahi vikalp chunein:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {clarificationOptions.map((opt) => (
                  <button
                    key={opt.category}
                    type="button"
                    onClick={() => onSelectClarification && onSelectClarification(opt)}
                    className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-primary hover:text-white dark:hover:bg-primary text-text text-xs font-semibold rounded-xl border border-primary/20 shadow-sm transition-all hover:scale-105 active:scale-95"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Extracted Entities Badges */}
      {entities && (entities.service || entities.location || entities.urgency || entities.budget) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            AI Extracted:
          </span>

          {entities.service && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800">
              <Briefcase className="w-3 h-3" />
              <span>Service: {extractedIntent?.serviceName || entities.service}</span>
              {onClearEntity && (
                <button
                  type="button"
                  onClick={() => onClearEntity("service")}
                  className="hover:text-blue-900 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}

          {entities.location && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
              <MapPin className="w-3 h-3" />
              <span>City: {entities.location}</span>
              {onClearEntity && (
                <button
                  type="button"
                  onClick={() => onClearEntity("location")}
                  className="hover:text-emerald-900 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}

          {entities.urgency && entities.urgency !== "flexible" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800">
              <Clock className="w-3 h-3" />
              <span>Urgency: {entities.urgency === "immediate" ? "Abhi Chahiye (Immediate)" : "Aaj (Today)"}</span>
              {onClearEntity && (
                <button
                  type="button"
                  onClick={() => onClearEntity("urgency")}
                  className="hover:text-amber-900 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}

          {entities.budget && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-medium border border-purple-200 dark:border-purple-800">
              <IndianRupee className="w-3 h-3" />
              <span>Budget: ≤ ₹{entities.budget}/hr</span>
              {onClearEntity && (
                <button
                  type="button"
                  onClick={() => onClearEntity("budget")}
                  className="hover:text-purple-900 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}
        </div>
      )}

      {/* Suggested Quick Queries */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Bolkar ya click karke dekhein:
          </p>
          {userCity && (
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" /> Aapka shahar: <strong>{userCity}</strong>
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              type="button"
              onClick={() => handlePromptClick(prompt.query)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 text-text-secondary hover:text-primary hover:border-primary/40 text-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:scale-102"
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
