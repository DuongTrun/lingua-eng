"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

interface Deck {
  topic: string;
  level: string;
  totalWords: number;
  learnedWords: number;
  dueWords: number;
}

export default function FlashcardsPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, loadUser } = useAuthStore();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "due" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");

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

  // Fetch Decks
  useEffect(() => {
    if (isAuthenticated && token) {
      const fetchDecks = async () => {
        try {
          const response = await api.get("/flashcards/decks");
          setDecks(response.data);
        } catch (error) {
          console.error("Failed to fetch decks:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchDecks();
    }
  }, [isAuthenticated, token]);

  // Map topic to emoji and description
  const getTopicMeta = (topic: string) => {
    const normalized = topic.toLowerCase();
    if (normalized.includes("travel") || normalized.includes("du lịch")) {
      return { emoji: "🏖️", desc: "Airport, hotel, and sightseeing essentials." };
    }
    if (normalized.includes("work") || normalized.includes("job") || normalized.includes("business") || normalized.includes("công việc")) {
      return { emoji: "💼", desc: "Corporate jargon, negotiation, and email etiquette." };
    }
    if (normalized.includes("food") || normalized.includes("dining") || normalized.includes("ẩm thực") || normalized.includes("ăn uống")) {
      return { emoji: "🍕", desc: "Ordering food, ingredients, and restaurant phrases." };
    }
    if (normalized.includes("health") || normalized.includes("medical") || normalized.includes("y tế") || normalized.includes("sức khỏe")) {
      return { emoji: "🏥", desc: "Symptoms, doctor visits, and pharmacy terms." };
    }
    if (normalized.includes("tech") || normalized.includes("technology") || normalized.includes("công nghệ")) {
      return { emoji: "💻", desc: "Software, hardware, and internet vocabulary." };
    }
    if (normalized.includes("art") || normalized.includes("culture") || normalized.includes("nghệ thuật")) {
      return { emoji: "🎨", desc: "Colors, shapes, and museum expressions." };
    }
    if (normalized.includes("nature") || normalized.includes("environment") || normalized.includes("môi trường")) {
      return { emoji: "🌲", desc: "Flora, fauna, weather, and climate vocabulary." };
    }
    if (normalized.includes("science") || normalized.includes("khoa học")) {
      return { emoji: "🔬", desc: "Scientific fields, lab terms, and theories." };
    }
    if (normalized.includes("family") || normalized.includes("gia đình")) {
      return { emoji: "🏠", desc: "Relationships, household items, and daily routines." };
    }
    return { emoji: "📚", desc: "Expand your English vocabulary in this interesting topic." };
  };

  // Capitalize first letter of topic
  const formatTopicName = (topic: string) => {
    return topic.charAt(0).toUpperCase() + topic.slice(1);
  };

  // Filter Decks
  const filteredDecks = decks.filter((deck) => {
    // 1. Search Query Filter
    const matchesSearch = deck.topic.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Level Filter
    const matchesLevel = selectedLevel === "all" || deck.level.toLowerCase() === selectedLevel.toLowerCase();
    
    // 3. Tab Filter
    let matchesTab = true;
    if (activeTab === "due") {
      matchesTab = deck.dueWords > 0;
    } else if (activeTab === "completed") {
      matchesTab = deck.learnedWords === deck.totalWords && deck.totalWords > 0;
    }

    return matchesSearch && matchesLevel && matchesTab;
  });

  const dueDecksCount = decks.filter(d => d.dueWords > 0).length;

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

      {/* Main Content Area */}
      <main className="flex-grow md:pl-[280px] mt-16 md:mt-0 p-6 md:p-margin-page relative z-10 overflow-y-auto max-w-container-max mx-auto w-full">
        {/* TopNavBar Component - Only show on desktop since mobile has Sidebar TopBar */}
        <header className="hidden md:flex justify-between items-center h-16 mb-8 border-b border-outline-variant/30 bg-background/80 backdrop-blur-md sticky top-0 z-40 w-full">
          <div className="md:hidden">
            <h1 className="text-headline-md font-extrabold text-primary text-xl">Lingua Eng</h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-orange-500 font-bold text-lg select-none">
              🔥 {user.streak}
            </div>
            <div className="flex items-center gap-1.5 text-yellow-500 font-bold text-lg select-none">
              🏆 {user.xp}
            </div>
          </div>
        </header>

        {/* Page Header */}
        <div className="mb-unit-xl">
          <h2 className="text-3xl font-extrabold text-on-surface mb-2">📚 Flashcards</h2>
          <p className="text-body-lg text-on-surface-variant text-sm">Build your vocabulary with spaced repetition</p>
        </div>

        {/* Controls Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-unit-md mb-unit-xl">
          {/* Tabs */}
          <div className="flex gap-2 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 font-semibold rounded-lg text-sm transition-all ${
                activeTab === "all"
                  ? "bg-pure-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-variant/50"
              }`}
            >
              All Decks
            </button>
            <button
              onClick={() => setActiveTab("due")}
              className={`px-4 py-2 font-semibold rounded-lg text-sm transition-all ${
                activeTab === "due"
                  ? "bg-pure-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-variant/50"
              }`}
            >
              Due Today ({dueDecksCount})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-2 font-semibold rounded-lg text-sm transition-all ${
                activeTab === "completed"
                  ? "bg-pure-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-variant/50"
              }`}
            >
              Completed
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-unit-md w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-pure-white border border-outline-variant rounded-lg text-sm focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all outline-none"
              />
            </div>
            <div className="relative">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 bg-pure-white border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 outline-none cursor-pointer"
              >
                <option value="all">All Levels</option>
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Inter.</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Mastery</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-lg">expand_more</span>
            </div>
          </div>
        </div>

        {/* Flashcard Decks Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
            <p className="text-sm text-on-surface-variant mt-4">Đang tải danh sách bộ từ vựng...</p>
          </div>
        ) : filteredDecks.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-2xl p-6 border border-pure-white/50 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-outline mb-2">style</span>
            <p className="font-bold text-lg">Không tìm thấy bộ từ vựng nào</p>
            <p className="text-sm text-on-surface-variant mt-1">Hãy thử đổi bộ lọc hoặc từ khóa tìm kiếm khác nhé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-unit-xl">
            {filteredDecks.map((deck) => {
              const { emoji, desc } = getTopicMeta(deck.topic);
              const progressPercent = deck.totalWords > 0 
                ? Math.min(100, Math.round((deck.learnedWords / deck.totalWords) * 100))
                : 0;
              const isDue = deck.dueWords > 0;
              const isCompleted = deck.learnedWords === deck.totalWords && deck.totalWords > 0;

              return (
                <div
                  key={`${deck.topic}-${deck.level}`}
                  className="bg-pure-white rounded-xl p-6 border border-outline-variant/30 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden group"
                >
                  {isDue && <div className="absolute top-0 left-0 w-full h-1 bg-secondary-container"></div>}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-2xl select-none">
                      {emoji}
                    </div>
                    <span className="px-2 py-1 bg-primary-fixed text-on-primary-fixed-variant rounded text-[10px] font-bold tracking-wider uppercase">
                      {deck.level}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">
                    {formatTopicName(deck.topic)}
                  </h3>
                  
                  <p className="text-xs text-on-surface-variant mb-6 flex-1">
                    {desc}
                  </p>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-on-surface-variant font-medium">
                        {deck.learnedWords}/{deck.totalWords} words
                      </span>
                      <span className={`${isCompleted ? 'text-secondary font-bold' : 'text-primary font-bold'}`}>
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-secondary-container' : 'bg-primary-container'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/20">
                    <div>
                      {isDue ? (
                        <div className="flex items-center gap-1.5 text-tertiary-container bg-tertiary-fixed px-2 py-1 rounded-md">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          <span className="text-[10px] font-bold tracking-wider">{deck.dueWords} DUE</span>
                        </div>
                      ) : isCompleted ? (
                        <div className="flex items-center gap-1.5 text-secondary bg-secondary-container/20 px-2 py-1 rounded-md text-xs font-bold">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Done
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant font-semibold">Up to date</span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => router.push(`/flashcards/review/${encodeURIComponent(deck.topic)}/${deck.level}`)}
                      className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-150 active:translate-y-px shadow-sm ${
                        isDue
                          ? "bg-secondary text-pure-white hover:bg-secondary/90"
                          : "bg-primary-container text-pure-white hover:bg-primary-container/90"
                      }`}
                    >
                      {isDue ? "Review" : "Study"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
