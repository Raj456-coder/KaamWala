"use client";

import { useState, useRef, useCallback } from "react";

export interface VoiceAssistantOptions {
  language?: "hi-IN" | "en-IN";
  onFinalTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export interface VoiceAssistantState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  statusText: string;
  error: string | null;
  language: "hi-IN" | "en-IN";
}

export function useVoiceAssistant(options?: VoiceAssistantOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const win = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  });
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<"hi-IN" | "en-IN">(options?.language || "hi-IN");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef(false);

  const getStatusText = useCallback(() => {
    if (error) return error;
    if (isListening) {
      return language === "hi-IN" ? "सुन रहा हूँ... बोलिए" : "Listening... Speak now";
    }
    return language === "hi-IN" ? "माइक दबाकर बोलें" : "Click mic to speak";
  }, [error, isListening, language]);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    isManuallyStoppedRef.current = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Aapke browser me Voice Recognition support nahi hai.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          const cleanFinal = final.trim();
          setTranscript(cleanFinal);
          setInterimTranscript("");
          if (options?.onFinalTranscript) {
            options.onFinalTranscript(cleanFinal);
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        if (isManuallyStoppedRef.current) return;
        setIsListening(false);
        const errType = event.error;

        let userMsg = "Aawaz pehchanne me dikkat hui. Kripya dobara koshish karein.";
        if (errType === "not-allowed" || errType === "permission-denied") {
          userMsg = "Microphone access denied. Kripya browser me mic permission allow karein.";
        } else if (errType === "no-speech") {
          userMsg = "Koi aawaz sunai nahi di. Kripya dobara bole.";
        } else if (errType === "network") {
          userMsg = "Network error. Kripya internet connection check karein.";
        }

        setError(userMsg);
        if (options?.onError) {
          options.onError(userMsg);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      const errMsg = err instanceof Error ? err.message : "Failed to start speech recognition";
      setError(errMsg);
    }
  }, [language, options]);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const cancelListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setInterimTranscript("");
    setTranscript("");
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === "hi-IN" ? "en-IN" : "hi-IN"));
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    statusText: getStatusText(),
    error,
    language,
    startListening,
    stopListening,
    cancelListening,
    toggleLanguage,
    setLanguage,
  };
}
