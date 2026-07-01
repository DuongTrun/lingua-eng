"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

interface WordForGame {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  level: string;
  topic: string;
  partOfSpeech: string; // 'Noun' | 'Verb' | 'Adjective' | 'Adverb'
  userChoice?: string;
}

export default function WordSorterPage() {
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useAuthStore();

  // Game States
  const [gameState, setGameState] = useState<"START" | "LOADING" | "GAMEPLAY" | "RESULTS">("START");
  const [words, setWords] = useState<WordForGame[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Autoplay phát âm khi từ vựng mới hiển thị
  useEffect(() => {
    if (gameState === "GAMEPLAY" && words.length > 0 && words[currentIndex]) {
      const timer = setTimeout(() => {
        speakWord(words[currentIndex].word);
      }, 400); // Trì hoãn nhẹ 400ms để hoạt ảnh lật bài mượt mà hơn
      return () => clearTimeout(timer);
    }
  }, [currentIndex, gameState, words]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => prev === message ? null : prev);
    }, 2500);
  };

  const handleUseHint = () => {
    if (xp < 10) {
      showToast("Không đủ điểm để gợi ý!");
      return;
    }
    setXp((prev) => Math.max(0, prev - 10));
    setHintUsed(true);
    showToast("-10 điểm!");
    speakWord(words[currentIndex].word);
  };

  // Feedback & Interactions
  const [feedbackState, setFeedbackState] = useState<"NONE" | "CORRECT" | "INCORRECT">("NONE");
  const [chosenCategory, setChosenCategory] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Results State
  const [correctWords, setCorrectWords] = useState<WordForGame[]>([]);
  const [incorrectWords, setIncorrectWords] = useState<WordForGame[]>([]);
  const [resultsActiveTab, setResultsActiveTab] = useState<"WRONG" | "CORRECT">("WRONG");
  const [selectedWordDetail, setSelectedWordDetail] = useState<WordForGame | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load Auth State
  useEffect(() => {
    const checkAuth = async () => {
      await loadUser();
      if (!useAuthStore.getState().isAuthenticated) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [loadUser, router]);

  // Load High Score from History
  useEffect(() => {
    const fetchHighScore = async () => {
      if (isAuthenticated) {
        try {
          const response = await api.get("/exercises/history");
          const history = response.data;
          if (Array.isArray(history)) {
            const gameResults = history.filter((r: { topic: string; xpEarned: number }) => r.topic === "Word Type Sorter");
            if (gameResults.length > 0) {
              const maxXP = Math.max(...gameResults.map((r: { xpEarned: number }) => r.xpEarned));
              setHighScore(maxXP);
            }
          }
        } catch (err) {
          console.error("Failed to fetch game history:", err);
        }
      }
    };
    fetchHighScore();
  }, [isAuthenticated, gameState]);

  // Gameplay Timer
  useEffect(() => {
    if (gameState !== "GAMEPLAY") return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Keyboard Shortcuts (Q, W, A, S)
  useEffect(() => {
    if (gameState !== "GAMEPLAY" || feedbackState !== "NONE") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === "Q") handleClassify("Noun");
      if (key === "W") handleClassify("Verb");
      if (key === "A") handleClassify("Adjective");
      if (key === "S") handleClassify("Adverb");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, feedbackState, currentIndex, words]);

  // Start the game by loading words
  const handleStartGame = async () => {
    setGameState("LOADING");
    try {
      const response = await api.get("/words/game");
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setWords(response.data);
        setCurrentIndex(0);
        setXp(0);
        setStreak(0);
        setMaxStreak(0);
        setElapsedSeconds(0);
        setCorrectWords([]);
        setIncorrectWords([]);
        setHintUsed(false);
        setFeedbackState("NONE");
        setChosenCategory(null);

        // Keep loading screen for 1.5 seconds for satisfying feel
        setTimeout(() => {
          setGameState("GAMEPLAY");
        }, 1500);
      } else {
        throw new Error("Không lấy được bộ từ vựng từ hệ thống!");
      }
    } catch (err) {
      console.error("Failed to load game vocabulary:", err);
      alert(err instanceof Error ? err.message : "Có lỗi xảy ra khi tải từ vựng!");
      setGameState("START");
    }
  };

  // Classify word logic
  const handleClassify = (pos: string) => {
    if (feedbackState !== "NONE") return;

    const currentWord = words[currentIndex];
    const isCorrect = pos.toLowerCase() === currentWord.partOfSpeech.toLowerCase();
    setChosenCategory(pos);

    if (isCorrect) {
      setFeedbackState("CORRECT");
      const xpGained = hintUsed ? 5 : 10;
      setXp((prev) => prev + xpGained);
      setStreak((prev) => {
        const next = prev + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
      setCorrectWords((prev) => [...prev, { ...currentWord, userChoice: pos }]);
    } else {
      setFeedbackState("INCORRECT");
      setStreak(0);
      setIncorrectWords((prev) => [...prev, { ...currentWord, userChoice: pos }]);
    }

    // Animation transition period
    setTimeout(() => {
      setFeedbackState("NONE");
      setChosenCategory(null);
      setDragOffset({ x: 0, y: 0 });
      setHintUsed(false);

      if (currentIndex + 1 < words.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        handleFinishGame();
      }
    }, 1200);
  };

  // Skip word
  const handleSkip = () => {
    if (feedbackState !== "NONE") return;
    const currentWord = words[currentIndex];
    setIncorrectWords((prev) => [...prev, { ...currentWord, userChoice: "Skipped" }]);
    setStreak(0);

    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
      setHintUsed(false);
    } else {
      handleFinishGame();
    }
  };

  // Complete game and submit scores
  const handleFinishGame = async () => {
    setGameState("RESULTS");
    try {
      const finalScore = correctWords.length;
      await api.post("/exercises/submit", {
        topic: "Word Type Sorter",
        level: user?.currentLevel || "B1",
        score: finalScore,
        total: words.length,
      });
    } catch (error) {
      console.error("Failed to submit game score to backend:", error);
    }
  };

  // Speak word using SpeechSynthesis
  const speakWord = (wordText: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  // Format Time to MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Pointer dragging events for central card (Native Drag & Drop)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (feedbackState !== "NONE") return;

    // 🚫 Không bắt đầu kéo thả nếu người dùng click vào các nút chức năng (phát âm, xem gợi ý)
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.tagName === "BUTTON") {
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setDragOffset({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    // Coordinate check relative to screen size (drag threshold)
    const threshold = 120;
    if (Math.abs(dragOffset.x) > threshold || Math.abs(dragOffset.y) > threshold) {
      let category = "";
      if (dragOffset.x < 0 && dragOffset.y < 0) {
        category = "Noun"; // Top-Left
      } else if (dragOffset.x > 0 && dragOffset.y < 0) {
        category = "Verb"; // Top-Right
      } else if (dragOffset.x < 0 && dragOffset.y > 0) {
        category = "Adjective"; // Bottom-Left
      } else if (dragOffset.x > 0 && dragOffset.y > 0) {
        category = "Adverb"; // Bottom-Right
      }

      if (category) {
        handleClassify(category);
      } else {
        setDragOffset({ x: 0, y: 0 });
      }
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Render components based on screen loading
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  // Helper to determine fly animation translation coordinates
  const getFlyStyles = (category: string) => {
    switch (category) {
      case "Noun":
        return { transform: "translate(-30vw, -30vh) scale(0.7) rotate(-15deg)", opacity: 0, transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" };
      case "Verb":
        return { transform: "translate(30vw, -30vh) scale(0.7) rotate(15deg)", opacity: 0, transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" };
      case "Adjective":
        return { transform: "translate(-30vw, 30vh) scale(0.7) rotate(-15deg)", opacity: 0, transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" };
      case "Adverb":
        return { transform: "translate(30vw, 30vh) scale(0.7) rotate(15deg)", opacity: 0, transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" };
      default:
        return {};
    }
  };

  return (
    <div className="bg-background min-h-screen text-on-surface flex flex-col md:flex-row relative overflow-x-hidden">
      {/* Sidebar navigation */}
      <Sidebar activeItem="word-sorter" showMobileHeader={false} />

      {/* Main Container */}
      <main className="flex-grow md:pl-[280px] min-h-screen flex flex-col relative z-10 w-full">
        {/* ========================================== */}
        {/* 1. START SCREEN                            */}
        {/* ========================================== */}
        {gameState === "START" && (
          <div className="flex-1 flex flex-col">
            {/* TopAppBar */}
            <header className="flex justify-between items-center px-6 h-16 w-full border-b border-outline-variant/30 bg-surface/75 backdrop-blur-md sticky top-0 z-30">
              <div className="md:hidden">
                <h1 className="text-headline-lg-mobile font-extrabold text-primary text-xl">Lingua Eng</h1>
              </div>
              <div className="hidden md:block">
                <span className="font-semibold text-on-surface-variant text-sm">AI Exercises</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-tertiary-fixed text-tertiary-fixed-dim px-3 py-1 rounded-full text-xs font-bold shadow-sm select-none border border-orange-200 text-orange-600">
                  🔥 {user.streak}
                </div>
                <div className="flex items-center gap-1.5 bg-primary-fixed text-primary px-3 py-1 rounded-full text-xs font-bold shadow-sm select-none border border-blue-200">
                  🏆 {user.xp} XP
                </div>
              </div>
            </header>

            {/* Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-4xl mx-auto w-full">
              {/* Header Title */}
              <div className="text-center mb-8 animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-3 flex items-center justify-center gap-2">
                  <span>🃏 Word Type Sorter</span>
                </h1>
                <p className="text-sm text-on-surface-variant max-w-lg mx-auto">
                  Phân loại 50 từ vựng vào đúng thể loại ngữ pháp: Danh từ, Động từ, Tính từ, Trạng từ. Nhanh tay, chính xác để đạt điểm tối đa!
                </p>
              </div>

              {/* Instructions Bento Card */}
              <div className="w-full bg-white rounded-[24px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-outline-variant/20 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-inverse-primary"></div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined font-bold">menu_book</span>
                  </div>
                  <h2 className="text-lg font-bold text-on-surface">Hướng dẫn chơi</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6 md:gap-10">
                  <ul className="space-y-4 text-sm text-on-surface-variant">
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary mt-0.5">touch_app</span>
                      <span>Chạm/Giữ thẻ từ vựng để kéo hoặc nhấp chọn phân loại trực tiếp.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary mt-0.5">drag_indicator</span>
                      <span>Kéo & thả thẻ từ vào đúng các góc tương ứng với từ loại của nó.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary mt-0.5">keyboard</span>
                      <span>Sử dụng phím tắt trên máy tính để thao tác cực nhanh: <strong>Q (Noun)</strong>, <strong>W (Verb)</strong>, <strong>A (Adjective)</strong>, <strong>S (Adverb)</strong>.</span>
                    </li>
                  </ul>

                  <div className="flex flex-col justify-center bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
                    <p className="text-[10px] font-bold text-outline mb-3 uppercase tracking-widest">Từ loại phân loại</p>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <div className="w-4 h-4 rounded bg-[#8b5cf6] shadow-sm"></div>
                        <span>Noun (Danh từ)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <div className="w-4 h-4 rounded bg-[#10b981] shadow-sm"></div>
                        <span>Verb (Động từ)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <div className="w-4 h-4 rounded bg-[#f59e0b] shadow-sm"></div>
                        <span>Adjective (Tính từ)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <div className="w-4 h-4 rounded bg-[#ec4899] shadow-sm"></div>
                        <span>Adverb (Trạng từ)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="mt-10 flex flex-col items-center gap-6 w-full">
                <div className="inline-flex items-center gap-2 bg-[#fffae5] border border-[#ffe066] text-[#b28a00] px-4 py-2 rounded-full text-xs font-bold shadow-sm">
                  <span>🏅</span>
                  <span>Kỷ lục cao nhất: {highScore} XP</span>
                </div>
                <button
                  onClick={handleStartGame}
                  className="w-full max-w-[360px] h-14 bg-primary text-white rounded-xl text-base font-bold shadow-md shadow-primary/20 hover:scale-[1.02] hover:bg-primary/95 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  Bắt đầu chơi
                  <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>sports_esports</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 2. LOADING SCREEN                          */}
        {/* ========================================== */}
        {gameState === "LOADING" && (
          <div className="flex-grow flex flex-col justify-center items-center p-6 bg-background relative overflow-hidden">
            {/* Visual zones background placeholders */}
            <div className="absolute top-8 left-8 w-44 h-28 rounded-xl border border-dashed border-[#8b5cf6]/30 bg-[#8b5cf6]/5 flex items-center justify-center opacity-40">
              <span className="text-xs font-bold text-[#8b5cf6] uppercase tracking-wider">Noun</span>
            </div>
            <div className="absolute top-8 right-8 w-44 h-28 rounded-xl border border-dashed border-[#10b981]/30 bg-[#10b981]/5 flex items-center justify-center opacity-40">
              <span className="text-xs font-bold text-[#10b981] uppercase tracking-wider">Verb</span>
            </div>
            <div className="absolute bottom-8 left-8 w-44 h-28 rounded-xl border border-dashed border-[#f59e0b]/30 bg-[#f59e0b]/5 flex items-center justify-center opacity-40">
              <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider">Adjective</span>
            </div>
            <div className="absolute bottom-8 right-8 w-44 h-28 rounded-xl border border-dashed border-[#ec4899]/30 bg-[#ec4899]/5 flex items-center justify-center opacity-40">
              <span className="text-xs font-bold text-[#ec4899] uppercase tracking-wider">Adverb</span>
            </div>

            {/* Central deck shimmer */}
            <div className="flex flex-col items-center gap-8 relative z-10">
              <div className="relative w-56 h-72">
                <div className="absolute w-full h-full bg-slate-200 rounded-2xl border border-outline-variant/30 transform rotate-6 scale-95 origin-bottom-right opacity-80"></div>
                <div className="absolute w-full h-full bg-slate-100 rounded-2xl border border-outline-variant/30 transform -rotate-3 scale-95 origin-bottom-left opacity-90"></div>
                <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl border border-outline-variant/50 p-6 flex flex-col justify-between overflow-hidden">
                  <div className="w-1/3 h-4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="w-full h-10 bg-slate-200 rounded animate-pulse my-auto"></div>
                  <div className="w-2/3 h-5 bg-slate-200 rounded animate-pulse"></div>
                  <div className="mt-auto flex justify-between w-full">
                    <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
                    <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Shuffling loader text */}
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-xl animate-spin">refresh</span>
                <p className="font-semibold text-sm text-on-surface">Đang xáo bộ bài 50 từ vựng...</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 3. GAMEPLAY SCREEN                         */}
        {/* ========================================== */}
        {gameState === "GAMEPLAY" && currentWord && (
          <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-background">
            {/* Global Overlay Effect on Feedback */}
            {feedbackState === "CORRECT" && (
              <div className="fixed inset-0 bg-green-600/5 z-0 pointer-events-none transition-all duration-300"></div>
            )}
            {feedbackState === "INCORRECT" && (
              <div className="fixed inset-0 bg-red-600/5 z-0 pointer-events-none transition-all duration-300"></div>
            )}

            {/* Top Bar Navigation */}
            <header className="flex justify-between items-center px-6 h-16 w-full border-b border-outline-variant/30 bg-surface/75 backdrop-blur-md z-40 sticky top-0">
              <div className="flex items-center gap-4">
                <h2 className="font-bold text-primary text-base hidden md:block select-none">Word Type Sorter</h2>
                <h2 className="font-bold text-primary text-base md:hidden select-none">Lingua Eng</h2>
              </div>

              <div className="flex items-center gap-4">
                {/* Stats Panel */}
                <div className="flex items-center gap-3 bg-surface-container-low px-4 py-1.5 rounded-full border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-1.5 text-orange-500 font-bold text-xs select-none">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                    <span>Streak: {streak}</span>
                  </div>
                  <div className="w-px h-3 bg-outline-variant/30"></div>
                  <div className="flex items-center gap-1.5 text-primary font-bold text-xs select-none">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
                    <span>XP: {xp}</span>
                  </div>
                  <div className="w-px h-3 bg-outline-variant/30"></div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant font-bold text-xs select-none">
                    <span className="material-symbols-outlined text-base">timer</span>
                    <span className="font-mono">{formatTime(elapsedSeconds)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (confirm("Bạn có chắc chắn muốn thoát game? Điểm số hiện tại sẽ không được lưu.")) {
                        setGameState("START");
                      }
                    }}
                    className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Progress Bar Row */}
            <div className="w-full bg-white border-b border-outline-variant/20 px-6 py-2.5 z-30 flex items-center gap-4 shadow-sm">
              <div className="text-xs font-bold text-on-surface-variant select-none min-w-[36px]">
                {currentIndex + 1}/{words.length}
              </div>
              <div className="flex-grow h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Central Canvas Board */}
            <div className="flex-grow relative w-full flex flex-col items-center justify-between p-6 md:p-12 overflow-hidden select-none">
              {/* Correct/Incorrect Floating popup */}
              {feedbackState === "CORRECT" && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                  <div className="bg-green-100 text-green-800 border border-green-300 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold">
                    <span>✅</span>
                    <span>Chính xác! +{hintUsed ? 5 : 10} XP</span>
                  </div>
                </div>
              )}
              {feedbackState === "INCORRECT" && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                  <div className="bg-red-100 text-red-800 border border-red-300 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                    <span>Sai rồi! &quot;{currentWord.word}&quot; là {currentWord.partOfSpeech}</span>
                  </div>
                </div>
              )}

              {/* 1280px container game */}
              <div className="w-full max-w-5xl flex-grow relative flex items-center justify-center">
                {/* ========================================== */}
                {/* 4 Classification Corner Zones (Desktop only) */}
                {/* ========================================== */}
                {/* Top-Left: Noun */}
                <div
                  className={`absolute top-0 left-0 w-52 h-44 border-2 border-dashed rounded-2xl hidden md:flex flex-col items-center justify-center gap-2.5 transition-all duration-300 ${
                    feedbackState === "INCORRECT" && chosenCategory === "Noun"
                      ? "border-red-500 bg-red-100/30 text-red-600 scale-95"
                      : feedbackState === "CORRECT" && currentWord.partOfSpeech === "Noun"
                      ? "border-green-500 bg-green-100/20 text-green-600 scale-105 shadow-[0_0_20px_rgba(22,163,74,0.2)]"
                      : "border-[#a78bfa]/50 bg-[#f3e8ff]/20 text-[#6d28d9] hover:bg-[#f3e8ff]/40"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow">
                    <span className="material-symbols-outlined text-[22px]">category</span>
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-sm">Noun</h3>
                    <span className="mt-1 px-1.5 py-0.5 bg-white rounded text-[10px] font-bold border border-[#d8b4fe] text-[#8b5cf6] shadow-sm inline-block">[Q]</span>
                  </div>
                </div>

                {/* Top-Right: Verb */}
                <div
                  className={`absolute top-0 right-0 w-52 h-44 border-2 border-dashed rounded-2xl hidden md:flex flex-col items-center justify-center gap-2.5 transition-all duration-300 ${
                    feedbackState === "INCORRECT" && chosenCategory === "Verb"
                      ? "border-red-500 bg-red-100/30 text-red-600 scale-95"
                      : feedbackState === "CORRECT" && currentWord.partOfSpeech === "Verb"
                      ? "border-green-500 bg-green-100/20 text-green-600 scale-105 shadow-[0_0_20px_rgba(22,163,74,0.2)]"
                      : "border-[#6ee7b7]/50 bg-[#d1fae5]/20 text-[#047857] hover:bg-[#d1fae5]/40"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#10b981] text-white flex items-center justify-center shadow">
                    <span className="material-symbols-outlined text-[22px]">bolt</span>
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-sm">Verb</h3>
                    <span className="mt-1 px-1.5 py-0.5 bg-white rounded text-[10px] font-bold border border-[#a7f3d0] text-[#10b981] shadow-sm inline-block">[W]</span>
                  </div>
                </div>

                {/* Bottom-Left: Adjective */}
                <div
                  className={`absolute bottom-0 left-0 w-52 h-44 border-2 border-dashed rounded-2xl hidden md:flex flex-col items-center justify-center gap-2.5 transition-all duration-300 ${
                    feedbackState === "INCORRECT" && chosenCategory === "Adjective"
                      ? "border-red-500 bg-red-100/30 text-red-600 scale-95"
                      : feedbackState === "CORRECT" && currentWord.partOfSpeech === "Adjective"
                      ? "border-green-500 bg-green-100/20 text-green-600 scale-105 shadow-[0_0_20px_rgba(22,163,74,0.2)]"
                      : "border-[#fcd34d]/50 bg-[#fef3c7]/20 text-[#b45309] hover:bg-[#fef3c7]/40"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#f59e0b] text-white flex items-center justify-center shadow">
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-sm">Adjective</h3>
                    <span className="mt-1 px-1.5 py-0.5 bg-white rounded text-[10px] font-bold border border-[#fde68a] text-[#f59e0b] shadow-sm inline-block">[A]</span>
                  </div>
                </div>

                {/* Bottom-Right: Adverb */}
                <div
                  className={`absolute bottom-0 right-0 w-52 h-44 border-2 border-dashed rounded-2xl hidden md:flex flex-col items-center justify-center gap-2.5 transition-all duration-300 ${
                    feedbackState === "INCORRECT" && chosenCategory === "Adverb"
                      ? "border-red-500 bg-red-100/30 text-red-600 scale-95"
                      : feedbackState === "CORRECT" && currentWord.partOfSpeech === "Adverb"
                      ? "border-green-500 bg-green-100/20 text-green-600 scale-105 shadow-[0_0_20px_rgba(22,163,74,0.2)]"
                      : "border-[#f9a8d4]/50 bg-[#fce7f3]/20 text-[#be185d] hover:bg-[#fce7f3]/40"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#ec4899] text-white flex items-center justify-center shadow">
                    <span className="material-symbols-outlined text-[22px]">speed</span>
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-sm">Adverb</h3>
                    <span className="mt-1 px-1.5 py-0.5 bg-white rounded text-[10px] font-bold border border-[#fbcfe8] text-[#ec4899] shadow-sm inline-block">[S]</span>
                  </div>
                </div>

                {/* ========================================== */}
                {/* Central Vocab Card (Draggable Stack)       */}
                {/* ========================================== */}
                <div
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  style={
                    feedbackState === "CORRECT"
                      ? getFlyStyles(currentWord.partOfSpeech)
                      : isDragging
                      ? { transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`, transition: "none" }
                      : { transform: "translate(0px, 0px) rotate(0deg)", transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }
                  }
                  className={`w-[320px] md:w-[340px] min-h-[210px] bg-white rounded-[24px] border p-6 flex flex-col items-center justify-center shadow-xl relative z-20 select-none ${
                    feedbackState === "INCORRECT"
                      ? "animate-shake border-red-500 border-4 shadow-red-500/10 cursor-not-allowed"
                      : feedbackState === "CORRECT"
                      ? "cursor-not-allowed"
                      : "cursor-grab active:cursor-grabbing hover:scale-[1.01]"
                  }`}
                >
                  {/* Decorative grip */}
                  <div className="absolute top-4 right-4 flex gap-1 select-none pointer-events-none">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                  </div>

                  {/* Penalty badge for hints */}
                  {hintUsed && (
                    <div className="absolute -top-3 left-4 bg-orange-100 text-orange-800 border border-orange-200 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm select-none">
                      <span className="text-[10px] font-bold uppercase tracking-wider">⚠️ -50% XP</span>
                    </div>
                  )}

                  <h3 className="text-3xl md:text-4xl font-extrabold text-on-surface select-text tracking-tight text-center mt-2">
                    {currentWord.word}
                  </h3>
                  <div className="flex items-center gap-1.5 text-slate-500 italic mt-1.5 mb-5 select-text">
                    <span>{currentWord.ipa}</span>
                    <button
                      onClick={() => speakWord(currentWord.word)}
                      className="p-1 hover:bg-slate-100 rounded-full transition-colors text-primary active:scale-90"
                    >
                      <span className="material-symbols-outlined text-base">volume_up</span>
                    </button>
                  </div>

                  {/* Expanded Hint Details */}
                  {hintUsed ? (
                    <div className="w-full bg-[#FFF9E6] border-l-4 border-[#F59E0B] p-4 rounded-r-lg flex flex-col gap-2 animate-fade-in text-left">
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[#B45309] text-[16px] mt-0.5">lightbulb</span>
                        <p className="text-xs text-[#92400E] leading-relaxed">
                          <strong className="font-semibold">Nghĩa:</strong> {currentWord.meaning}
                        </p>
                      </div>
                      <div className="pl-6 border-t border-[#fde68a]/30 pt-1.5">
                        <p className="text-xs text-[#92400E] italic leading-normal">
                          &quot;{currentWord.example}&quot;
                        </p>
                        <p className="text-[11px] text-[#b45309] opacity-80 mt-0.5">
                          {currentWord.exampleMeaning}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleUseHint}
                      className="mt-auto flex items-center gap-1.5 text-primary hover:text-[#3323cc] transition-colors font-bold text-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">lightbulb</span>
                      <span>Xem gợi ý</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ========================================== */}
              {/* Controls Classification Buttons (Mobile only) */}
              {/* ========================================== */}
              <div className="w-full grid grid-cols-2 gap-3 mt-8 md:hidden relative z-30">
                <button
                  onClick={() => handleClassify("Noun")}
                  className={`h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all border active:scale-95 shadow-sm group ${
                    feedbackState === "INCORRECT" && chosenCategory === "Noun"
                      ? "border-red-500 bg-red-100/30 text-red-700"
                      : feedbackState === "CORRECT" && currentWord.partOfSpeech === "Noun"
                      ? "border-green-500 bg-green-100/20 text-green-700 font-bold"
                      : "bg-[#8b5cf6]/5 border-[#8b5cf6]/20 text-[#6d28d9] active:bg-[#8b5cf6]/10"
                  }`}
                >
                  <span className="text-sm font-bold">Noun</span>
                  <span className="text-[8px] opacity-75 uppercase">Danh từ</span>
                </button>

                <button
                  onClick={() => handleClassify("Verb")}
                  className={`h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all border active:scale-95 shadow-sm group ${
                    feedbackState === "INCORRECT" && chosenCategory === "Verb"
                      ? "border-red-500 bg-red-100/30 text-red-700"
                      : feedbackState === "CORRECT" && currentWord.partOfSpeech === "Verb"
                      ? "border-green-500 bg-green-100/20 text-green-700 font-bold"
                      : "bg-[#10b981]/5 border-[#10b981]/20 text-[#047857] active:bg-[#10b981]/10"
                  }`}
                >
                  <span className="text-sm font-bold">Verb</span>
                  <span className="text-[8px] opacity-75 uppercase">Động từ</span>
                </button>

                <button
                  onClick={() => handleClassify("Adjective")}
                  className={`h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all border active:scale-95 shadow-sm group ${
                    feedbackState === "INCORRECT" && chosenCategory === "Adjective"
                      ? "border-red-500 bg-red-100/30 text-red-700"
                      : feedbackState === "CORRECT" && currentWord.partOfSpeech === "Adjective"
                      ? "border-green-500 bg-green-100/20 text-green-700 font-bold"
                      : "bg-[#f59e0b]/5 border-[#f59e0b]/20 text-[#b45309] active:bg-[#f59e0b]/10"
                  }`}
                >
                  <span className="text-sm font-bold">Adjective</span>
                  <span className="text-[8px] opacity-75 uppercase">Tính từ</span>
                </button>

                <button
                  onClick={() => handleClassify("Adverb")}
                  className={`h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all border active:scale-95 shadow-sm group ${
                    feedbackState === "INCORRECT" && chosenCategory === "Adverb"
                      ? "border-red-500 bg-red-100/30 text-red-700"
                      : feedbackState === "CORRECT" && currentWord.partOfSpeech === "Adverb"
                      ? "border-green-500 bg-green-100/20 text-green-700 font-bold"
                      : "bg-[#ec4899]/5 border-[#ec4899]/20 text-[#be185d] active:bg-[#ec4899]/10"
                  }`}
                >
                  <span className="text-sm font-bold">Adverb</span>
                  <span className="text-[8px] opacity-75 uppercase">Trạng từ</span>
                </button>
              </div>

              {/* Skip word action */}
              <div className="w-full flex justify-center mt-6">
                <button
                  onClick={handleSkip}
                  className="text-primary font-bold text-xs hover:underline flex items-center gap-1 active:scale-95 transition-transform opacity-70 hover:opacity-100 cursor-pointer"
                >
                  <span>Bỏ qua từ này</span>
                  <span className="material-symbols-outlined text-sm">skip_next</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 4. RESULTS SCREEN                          */}
        {/* ========================================== */}
        {gameState === "RESULTS" && (
          <div className="flex-1 flex flex-col bg-background">
            {/* TopAppBar */}
            <header className="flex justify-between items-center px-6 h-16 w-full border-b border-outline-variant/30 bg-surface/75 backdrop-blur-md sticky top-0 z-30">
              <div>
                <h2 className="font-bold text-primary text-base">Kết quả Mini-game</h2>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/exercises")}
                  className="px-3 py-1.5 bg-[#f2f4f6] text-[#464555] rounded-xl text-xs font-bold transition-all hover:bg-slate-200 active:scale-95 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Quay lại</span>
                </button>
              </div>
            </header>

            {/* Results Canvas */}
            <div className="flex-1 p-6 md:p-8 flex items-center justify-center pb-20 relative overflow-hidden">
              <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none"></div>

              <div className="w-full max-w-4xl flex flex-col gap-6 relative z-10">
                {/* Result main panel */}
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-outline-variant/30 relative overflow-hidden flex flex-col items-center text-center">
                  <div className="mb-2">
                    <span className="text-4xl inline-block animate-bounce" style={{ animationDuration: "2.5s" }}>🎉</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-primary mb-1">Hoàn thành xuất sắc!</h2>
                  <p className="text-sm text-on-surface-variant mb-6 font-medium">Bạn đã phân loại xong 50 từ vựng của lượt chơi.</p>

                  {/* Summary Grid stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-1.5 hover:shadow-md transition-shadow">
                      <span className="text-xl">🎯</span>
                      <span className="text-xl font-bold text-[#10B981]">
                        {Math.round((correctWords.length / words.length) * 100)}%
                      </span>
                      <span className="text-[10px] text-outline font-bold uppercase tracking-wider">Độ chính xác</span>
                    </div>

                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-1.5 hover:shadow-md transition-shadow">
                      <span className="text-xl">💎</span>
                      <span className="text-xl font-bold text-primary">+{xp}</span>
                      <span className="text-[10px] text-outline font-bold uppercase tracking-wider">Kinh nghiệm XP</span>
                    </div>

                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-1.5 hover:shadow-md transition-shadow">
                      <span className="text-xl">⚡</span>
                      <span className="text-xl font-bold text-[#f59e0b]">{maxStreak}</span>
                      <span className="text-[10px] text-outline font-bold uppercase tracking-wider">Chuỗi (Combo)</span>
                    </div>

                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-1.5 hover:shadow-md transition-shadow">
                      <span className="text-xl">⏱️</span>
                      <span className="text-xl font-bold text-on-surface font-mono">{formatTime(elapsedSeconds)}</span>
                      <span className="text-[10px] text-outline font-bold uppercase tracking-wider">Thời gian chơi</span>
                    </div>
                  </div>

                  {/* Words list breakdown */}
                  <div className="w-full bg-white rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden text-left mb-6">
                    <div className="p-4 border-b border-outline-variant/10 bg-slate-50 flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-500">assignment</span>
                      <h3 className="font-bold text-sm text-on-surface select-none">Chi tiết các câu hỏi</h3>
                    </div>

                    {/* Tabs switcher */}
                    <div className="flex border-b border-outline-variant/15">
                      <button
                        onClick={() => setResultsActiveTab("WRONG")}
                        className={`flex-1 py-3 px-4 font-bold text-sm border-b-2 text-center transition-colors ${
                          resultsActiveTab === "WRONG"
                            ? "text-error border-error bg-error/5"
                            : "text-on-surface-variant hover:bg-slate-50 border-transparent"
                        }`}
                      >
                        ❌ Trả lời sai/Bỏ qua ({incorrectWords.length})
                      </button>
                      <button
                        onClick={() => setResultsActiveTab("CORRECT")}
                        className={`flex-1 py-3 px-4 font-bold text-sm border-b-2 text-center transition-colors ${
                          resultsActiveTab === "CORRECT"
                            ? "text-green-700 border-green-600 bg-green-50/50"
                            : "text-on-surface-variant hover:bg-slate-50 border-transparent"
                        }`}
                      >
                        ✅ Trả lời đúng ({correctWords.length})
                      </button>
                    </div>

                    {/* Word list tab content */}
                    <div className="p-5 max-h-[220px] overflow-y-auto">
                      {resultsActiveTab === "WRONG" ? (
                        incorrectWords.length > 0 ? (
                          <div className="flex flex-wrap gap-2.5">
                            {incorrectWords.map((item) => (
                              <span
                                key={item.id}
                                onClick={() => {
                                  setSelectedWordDetail(item);
                                  setShowDetailModal(true);
                                }}
                                className="px-3 py-1.5 rounded-full bg-red-50 text-red-800 text-xs font-semibold border border-red-200/50 cursor-pointer hover:shadow-sm hover:scale-[1.01] transition-all flex items-center gap-1.5"
                              >
                                <span>{item.word}</span>
                                <span className="px-1 py-0.5 bg-red-200/50 rounded text-[9px] font-bold text-red-900 uppercase">
                                  {item.partOfSpeech.substring(0, 3)}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic text-center py-4">Tuyệt vời! Bạn không trả lời sai câu nào.</p>
                        )
                      ) : correctWords.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5">
                          {correctWords.map((item) => (
                            <span
                              key={item.id}
                              onClick={() => {
                                setSelectedWordDetail(item);
                                setShowDetailModal(true);
                              }}
                              className="px-3 py-1.5 rounded-full bg-green-50 text-green-800 text-xs font-semibold border border-green-200/50 cursor-pointer hover:shadow-sm hover:scale-[1.01] transition-all flex items-center gap-1.5"
                            >
                              <span>{item.word}</span>
                              <span className="px-1 py-0.5 bg-green-200/50 rounded text-[9px] font-bold text-green-900 uppercase">
                                {item.partOfSpeech.substring(0, 3)}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic text-center py-4">Bạn chưa phân loại đúng từ nào ở lượt chơi này.</p>
                      )}
                      {(resultsActiveTab === "WRONG" && incorrectWords.length > 0) || (resultsActiveTab === "CORRECT" && correctWords.length > 0) ? (
                        <p className="text-[10px] text-slate-400 italic mt-3 select-none">Nhấp vào từ để xem lại nghĩa chi tiết và câu ví dụ.</p>
                      ) : null}
                    </div>
                  </div>

                  {/* CTA replay */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
                    <button
                      onClick={handleStartGame}
                      className="w-full sm:w-[260px] h-12 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#3323cc] hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Chơi lại lượt mới 🔄
                    </button>
                    <button
                      onClick={() => router.push("/exercises")}
                      className="text-primary hover:underline text-sm font-semibold cursor-pointer"
                    >
                      ← Quay lại Danh mục AI Exercises
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================== */}
      {/* 5. WORD DETAIL MODAL                       */}
      {/* ========================================== */}
      {showDetailModal && selectedWordDetail && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetailModal(false);
              setSelectedWordDetail(null);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          {/* Modal Container */}
          <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col relative animate-fade-in">
            {/* Header with error state */}
            <div className="flex items-start justify-between p-6 pb-2">
              <div>
                {selectedWordDetail.userChoice === "Skipped" ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold select-none">
                    <span className="material-symbols-outlined text-sm font-bold">help</span>
                    <span>Đã bỏ qua</span>
                  </div>
                ) : selectedWordDetail.userChoice?.toLowerCase() !== selectedWordDetail.partOfSpeech.toLowerCase() ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 border border-red-200 rounded-full text-xs font-semibold select-none">
                    <span className="material-symbols-outlined text-sm font-bold">close</span>
                    <span>Đã trả lời sai</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-xs font-semibold select-none">
                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                    <span>Đã trả lời đúng</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedWordDetail(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Word Information content */}
            <div className="px-6 py-4 flex flex-col gap-5">
              {/* Word and POS */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">
                    {selectedWordDetail.word}
                  </h2>
                  <span className="px-2.5 py-0.5 bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2] rounded-md text-[10px] font-bold uppercase select-none">
                    {selectedWordDetail.partOfSpeech}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 mt-1 select-text">
                  <span className="font-mono">{selectedWordDetail.ipa}</span>
                  <button
                    onClick={() => speakWord(selectedWordDetail.word)}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors text-primary active:scale-90"
                  >
                    <span className="material-symbols-outlined text-base">volume_up</span>
                  </button>
                </div>
              </div>

              {/* Definition */}
              <div className="text-lg font-bold text-[#1e00a9] select-text">
                {selectedWordDetail.meaning}
              </div>

              {/* Sentence example */}
              <div className="bg-slate-50 border-l-4 border-primary rounded-r-lg p-4 shadow-sm select-text">
                <p className="text-sm font-semibold italic text-slate-800 mb-1.5 leading-relaxed">
                  &quot;{selectedWordDetail.example}&quot;
                </p>
                <p className="text-xs text-slate-500">
                  {selectedWordDetail.exampleMeaning}
                </p>
              </div>

              {/* Detail comparisons */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200/50">
                  <span className="text-xs text-slate-500">Bạn đã chọn:</span>
                  <div
                    className={`flex items-center gap-1 text-xs font-bold ${
                      selectedWordDetail.userChoice?.toLowerCase() === selectedWordDetail.partOfSpeech.toLowerCase()
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    <span>{selectedWordDetail.userChoice || "Không"}</span>
                    <span className="material-symbols-outlined text-sm font-bold">
                      {selectedWordDetail.userChoice?.toLowerCase() === selectedWordDetail.partOfSpeech.toLowerCase()
                        ? "check"
                        : "close"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-3 py-2 bg-green-50/50 rounded-lg border border-green-100">
                  <span className="text-xs text-slate-500">Đáp án đúng:</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-green-700">
                    <span>{selectedWordDetail.partOfSpeech}</span>
                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer close CTA */}
            <div className="p-6 pt-2">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedWordDetail(null);
                }}
                className="w-full h-11 bg-primary text-white text-sm font-bold rounded-xl hover:bg-[#3323cc] transition-all active:scale-[0.98] shadow-sm shadow-primary/20 flex items-center justify-center cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 Toast thông báo điểm & cảnh báo */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-[fadeIn_0.2s_ease-out] border border-white/10">
          <span className="material-symbols-outlined text-amber-400 text-lg">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
