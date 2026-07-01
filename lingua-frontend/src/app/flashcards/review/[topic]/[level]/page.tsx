"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

interface WordProgress {
  interval: number;
  repetition: number;
  efactor: number;
  dueDate: string;
}

interface Word {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  progress: WordProgress | null;
}

export default function ReviewSessionPage() {
  const router = useRouter();
  const params = useParams();
  
  const rawTopic = params.topic ? (params.topic as string) : "";
  const topic = decodeURIComponent(rawTopic);
  const level = params.level ? (params.level as string) : "";

  const { user, token, isAuthenticated, loadUser } = useAuthStore();
  
  const [words, setWords] = useState<Word[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load auth state
  useEffect(() => {
    const checkAuth = async () => {
      await loadUser();
      if (!useAuthStore.getState().isAuthenticated) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [loadUser, router]);

  // Fetch words in deck
  useEffect(() => {
    if (isAuthenticated && token && topic && level) {
      const fetchWords = async () => {
        try {
          const response = await api.get(`/flashcards/decks/${encodeURIComponent(topic)}/${level}`);
          const fetchedWords = response.data as Word[];
          
          // Sort words: prioritize due words or unlearned words
          const sorted = [...fetchedWords].sort((a, b) => {
            const aDue = a.progress ? new Date(a.progress.dueDate).getTime() : 0;
            const bDue = b.progress ? new Date(b.progress.dueDate).getTime() : 0;
            
            // Unlearned words first, then oldest due dates
            if (!a.progress && b.progress) return -1;
            if (a.progress && !b.progress) return 1;
            return aDue - bDue;
          });

          setWords(sorted);
        } catch (error) {
          console.error("Failed to fetch words in deck:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchWords();
    }
  }, [isAuthenticated, token, topic, level]);

  // Start timer when words are loaded
  useEffect(() => {
    if (!loading && words.length > 0 && !sessionCompleted) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, words.length, sessionCompleted]);

  // TTS audio playback
  const speakWord = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9; // slightly slower for clarity
      window.speechSynthesis.speak(utterance);
    }
  };

  // Auto play audio when word index changes
  useEffect(() => {
    if (words.length > 0 && currentIdx < words.length && !sessionCompleted) {
      // Small timeout to let screen transition
      const timer = setTimeout(() => {
        speakWord(words[currentIdx].word);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIdx, words, sessionCompleted]);

  const handleRate = useCallback(async (quality: number) => {
    if (submitting || currentIdx >= words.length) return;

    setSubmitting(true);
    const activeWord = words[currentIdx];

    try {
      // POST to backend API
      await api.post("/flashcards/review", {
        wordId: activeWord.id,
        quality: quality,
      });

      // Proceed to next card or complete session
      setIsFlipped(false);
      
      // Delay slightly for flipping back animation to complete
      setTimeout(() => {
        if (currentIdx + 1 < words.length) {
          setCurrentIdx((prev) => prev + 1);
        } else {
          setSessionCompleted(true);
          if (timerRef.current) clearInterval(timerRef.current);
        }
        setSubmitting(false);
      }, 200);

    } catch (err) {
      console.error("Failed to submit review:", err);
      alert(err instanceof Error ? err.message : "Có lỗi xảy ra khi chấm điểm thẻ!");
      setSubmitting(false);
    }
  }, [submitting, currentIdx, words]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionCompleted || loading || words.length === 0) return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === "1") {
          handleRate(0); // Again
        } else if (e.key === "2") {
          handleRate(2); // Hard
        } else if (e.key === "3") {
          handleRate(4); // Good
        } else if (e.key === "4") {
          handleRate(5); // Easy
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, currentIdx, words, sessionCompleted, loading, handleRate]);

  // Helper to format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen text-on-surface flex flex-col md:flex-row relative">
      {/* Sidebar navigation */}
      <Sidebar activeItem="flashcards" />

      {/* Main Content Area - Focused Mode */}
      <main className="flex-grow md:pl-[280px] mt-16 md:mt-0 flex flex-col items-center justify-center p-6 md:p-margin-page relative min-h-screen">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
            <p className="text-sm text-on-surface-variant mt-4">Đang tải bộ từ vựng...</p>
          </div>
        ) : words.length === 0 ? (
          <div className="text-center max-w-md glass-panel rounded-2xl p-8 border border-pure-white/50 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-outline mb-2">style</span>
            <h3 className="font-bold text-lg">Không có từ vựng nào</h3>
            <p className="text-sm text-on-surface-variant mt-2 mb-6">Bộ từ vựng này hiện chưa được cấu hình hoặc không có từ nào.</p>
            <button
              onClick={() => router.push("/flashcards")}
              className="py-2.5 px-6 bg-primary text-pure-white font-bold rounded-xl text-sm transition-all"
            >
              Quay lại thư viện
            </button>
          </div>
        ) : sessionCompleted ? (
          /* Session Completed Screen */
          <div className="w-full max-w-xl text-center glass-panel rounded-2xl p-8 border border-pure-white/50 shadow-md my-8 animate-[fadeIn_0.5s_ease-out]">
            <span className="text-6xl mb-4 block select-none">🎉</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface mb-2">Tuyệt vời!</h2>
            <p className="text-sm text-on-surface-variant mb-6">Bạn đã hoàn thành phiên học bộ từ vựng **{topic}**.</p>
            
            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary text-2xl mb-1">alarm</span>
                <p className="text-xs text-on-surface-variant font-medium">Thời gian học</p>
                <p className="text-lg font-bold text-on-surface mt-0.5">{formatTime(elapsedSeconds)}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
                <span className="material-symbols-outlined text-secondary text-2xl mb-1">style</span>
                <p className="text-xs text-on-surface-variant font-medium">Số từ đã ôn</p>
                <p className="text-lg font-bold text-on-surface mt-0.5">{words.length} từ</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/flashcards")}
                className="w-full py-3 bg-primary text-pure-white font-bold rounded-xl text-sm transition-all hover:bg-primary/95 shadow-md shadow-primary/10"
              >
                Quay lại thư viện Decks
              </button>
            </div>
          </div>
        ) : (
          /* Active Review Session */
          <div className="w-full max-w-3xl flex flex-col items-center">
            {/* Focus Mode Header */}
            <div className="absolute top-8 left-0 right-0 px-6 md:px-12 flex justify-between items-center max-w-4xl mx-auto w-full z-10">
              <button
                onClick={() => router.push("/flashcards")}
                className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer group"
              >
                <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                <span className="text-sm font-semibold text-on-surface truncate max-w-[150px] md:max-w-xs">
                  {topic} — {level}
                </span>
              </button>

              <div className="flex flex-col items-center flex-1 mx-4 md:mx-8">
                <div className="flex justify-between w-full text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  <span>Card {currentIdx + 1} of {words.length}</span>
                  <span className="flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-sm leading-none">timer</span>
                    {formatTime(elapsedSeconds)}
                  </span>
                </div>
                <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentIdx) / words.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <button
                onClick={() => router.push("/flashcards")}
                className="text-on-surface-variant hover:text-error-rose transition-colors"
                title="Đóng phiên học"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Flashcard Centerpiece */}
            <div
              className="flashcard-container w-full max-w-[500px] h-[320px] mb-12 cursor-pointer relative"
              onClick={() => setIsFlipped((prev) => !prev)}
            >
              <div
                className={`flashcard-inner relative w-full h-full rounded-2xl bg-pure-white border border-outline-variant/30 hover:shadow-lg transition-shadow ${
                  isFlipped ? "flashcard-flipped" : ""
                }`}
              >
                {/* Front Side */}
                <div className="flashcard-face rounded-2xl p-8 flex flex-col items-center justify-center bg-pure-white">
                  <h2 className="text-headline-lg font-extrabold text-on-surface text-3xl mb-1 text-center select-all">
                    {words[currentIdx].word}
                  </h2>
                  <p className="text-body-lg font-phonetic text-outline mb-6">
                    {words[currentIdx].ipa}
                  </p>
                  
                  {/* Speaker Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevent flipping card
                      speakWord(words[currentIdx].word);
                    }}
                    className="w-12 h-12 rounded-full bg-primary/5 text-primary flex items-center justify-center hover:bg-primary/10 transition-colors mb-auto active:scale-95"
                    title="Nghe phát âm"
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      volume_up
                    </span>
                  </button>
                  
                  <div className="text-[10px] font-bold uppercase tracking-wider text-outline mt-auto flex items-center gap-1.5 select-none">
                    <span className="material-symbols-outlined text-sm">touch_app</span>
                    Click card để xem nghĩa
                  </div>
                </div>

                {/* Back Side */}
                <div className="flashcard-face flashcard-back rounded-2xl p-8 flex flex-col items-center justify-center bg-pure-white border-b-4 border-primary">
                  <h3 className="text-xl font-bold text-primary mb-4 text-center">
                    {words[currentIdx].meaning}
                  </h3>
                  
                  <div className="bg-surface p-4 rounded-xl w-full border border-surface-variant/50 max-h-[140px] overflow-y-auto">
                    <p className="text-sm text-on-surface font-semibold mb-1">
                      &ldquo;{words[currentIdx].example}&rdquo;
                    </p>
                    <p className="text-xs text-on-surface-variant italic">
                      &ldquo;{words[currentIdx].exampleMeaning}&rdquo;
                    </p>
                  </div>
                  
                  <div className="text-[10px] font-bold uppercase tracking-wider text-outline mt-auto flex items-center gap-1.5 select-none">
                    <span className="material-symbols-outlined text-sm">touch_app</span>
                    Click card để ẩn
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Interaction Bar (SRS) */}
            <div className={`flex gap-3 md:gap-4 w-full max-w-2xl justify-center px-4 transition-all duration-200 ${
              isFlipped ? "opacity-100 pointer-events-auto" : "opacity-30 pointer-events-none"
            }`}>
              {/* Again */}
              <button
                onClick={() => handleRate(0)}
                disabled={submitting || !isFlipped}
                className="srs-btn flex-1 flex flex-col items-center justify-center py-3 bg-pure-white border border-error-rose/20 rounded-xl hover:bg-error-container/20 text-error-rose transition-colors group active:translate-y-0.5 active:shadow-sm"
              >
                <span className="material-symbols-outlined mb-0.5 group-hover:scale-105 transition-transform">close</span>
                <span className="text-xs font-bold mb-0.5">Again</span>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Quên rồi</span>
              </button>

              {/* Hard */}
              <button
                onClick={() => handleRate(2)}
                disabled={submitting || !isFlipped}
                className="srs-btn flex-1 flex flex-col items-center justify-center py-3 bg-pure-white border border-amber-500/20 rounded-xl hover:bg-amber-500/5 text-amber-600 transition-colors group active:translate-y-0.5 active:shadow-sm"
              >
                <span className="material-symbols-outlined mb-0.5 group-hover:scale-105 transition-transform">sentiment_dissatisfied</span>
                <span className="text-xs font-bold mb-0.5">Hard</span>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Khó nhớ</span>
              </button>

              {/* Good */}
              <button
                onClick={() => handleRate(4)}
                disabled={submitting || !isFlipped}
                className="srs-btn flex-1 flex flex-col items-center justify-center py-3 bg-pure-white border border-secondary/20 rounded-xl hover:bg-secondary-container/20 text-secondary transition-colors group active:translate-y-0.5 active:shadow-sm"
              >
                <span className="material-symbols-outlined mb-0.5 group-hover:scale-105 transition-transform">thumb_up</span>
                <span className="text-xs font-bold mb-0.5">Good</span>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Nhớ được</span>
              </button>

              {/* Easy */}
              <button
                onClick={() => handleRate(5)}
                disabled={submitting || !isFlipped}
                className="srs-btn flex-1 flex flex-col items-center justify-center py-3 bg-primary text-pure-white rounded-xl hover:bg-primary/90 transition-colors group shadow-md shadow-primary/10 active:translate-y-0.5 active:shadow-sm"
              >
                <span className="material-symbols-outlined mb-0.5 group-hover:-translate-y-0.5 transition-transform">rocket_launch</span>
                <span className="text-xs font-bold mb-0.5">Easy</span>
                <span className="text-[9px] font-bold text-primary-fixed uppercase tracking-wider">Quá dễ</span>
              </button>
            </div>
            
            {/* Keyboard tips */}
            <p className="text-[10px] text-on-surface-variant mt-6 text-center select-none hidden md:block">
              💡 Phím tắt: **Space** để lật thẻ | Nhấn **1, 2, 3, 4** để đánh giá (Again, Hard, Good, Easy) sau khi lật.
            </p>

          </div>
        )}
      </main>
    </div>
  );
}
