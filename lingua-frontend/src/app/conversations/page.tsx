"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useConversationStore } from "@/store/useConversationStore";
import Sidebar from "@/components/Sidebar";
import { useAppModeStore } from "@/store/useAppModeStore";

interface Scenario {
  id: string;
  title: string;
  emoji: string;
  suggestedLevel: string;
  description: string;
  duration: string;
  bgGradient: string;
  radialColor: string;
}


const SCENARIOS: Scenario[] = [
  {
    id: "At the Airport",
    title: "At the Airport",
    emoji: "🛫",
    suggestedLevel: "A2-B1",
    description: "Check-in, ask directions, and handle delays smoothly.",
    duration: "~10 min",
    bgGradient: "from-blue-50 to-indigo-50",
    radialColor: "from-primary/30",
  },
  {
    id: "Ordering at a Restaurant",
    title: "Ordering at a Restaurant",
    emoji: "🍽️",
    suggestedLevel: "A2",
    description: "Reserve a table, order food, and ask for the bill with confidence.",
    duration: "~8 min",
    bgGradient: "from-amber-50 to-orange-50",
    radialColor: "from-amber-500/30",
  },
  {
    id: "Job Interview",
    title: "Job Interview",
    emoji: "💼",
    suggestedLevel: "B1-B2",
    description: "Practice answering common interview questions and detailing experience.",
    duration: "~15 min",
    bgGradient: "from-slate-50 to-gray-100",
    radialColor: "from-slate-500/30",
  },
  {
    id: "Hotel Check-in",
    title: "Hotel Check-in",
    emoji: "🏨",
    suggestedLevel: "A2-B1",
    description: "Book a room, request specific amenities, and manage complaints.",
    duration: "~10 min",
    bgGradient: "from-teal-50 to-cyan-50",
    radialColor: "from-teal-500/30",
  },
  {
    id: "Shopping",
    title: "Shopping",
    emoji: "🛒",
    suggestedLevel: "A2",
    description: "Ask about sizes, negotiate prices, and understand return policies.",
    duration: "~8 min",
    bgGradient: "from-pink-50 to-rose-50",
    radialColor: "from-pink-500/30",
  },
  {
    id: "At the Doctor",
    title: "At the Doctor",
    emoji: "🏥",
    suggestedLevel: "B1",
    description: "Describe symptoms clearly and understand medical prescriptions.",
    duration: "~12 min",
    bgGradient: "from-green-50 to-emerald-50",
    radialColor: "from-emerald-500/30",
  },
  {
    id: "Making New Friends",
    title: "Making New Friends",
    emoji: "👋",
    suggestedLevel: "A2-B1",
    description: "Introduce yourself, talk about hobbies, and make small talk.",
    duration: "~10 min",
    bgGradient: "from-yellow-50 to-amber-50",
    radialColor: "from-yellow-500/30",
  },
  {
    id: "Phone Call",
    title: "Phone Call",
    emoji: "📞",
    suggestedLevel: "B1-B2",
    description: "Schedule appointments, handle bad connections, and leave messages.",
    duration: "~12 min",
    bgGradient: "from-indigo-50 to-violet-50",
    radialColor: "from-indigo-500/30",
  },
  {
    id: "Discussing Movies",
    title: "Discussing Movies",
    emoji: "🎬",
    suggestedLevel: "B2",
    description: "Share opinions, critique plots, and enthusiastically recommend films.",
    duration: "~15 min",
    bgGradient: "from-purple-50 to-fuchsia-50",
    radialColor: "from-purple-500/30",
  },
  {
    id: "Lash Salon Consultation",
    title: "Eyelash Consultation",
    emoji: "👁️",
    suggestedLevel: "A2-B2",
    description: "Consult a client on eyelash styles (classic, volume, hybrid), lengths and curls.",
    duration: "~10 min",
    bgGradient: "from-rose-50 to-pink-50",
    radialColor: "from-rose-500/30",
  },
  {
    id: "Hair Extensions Consultation",
    title: "Hair Extensions Consultation",
    emoji: "💇",
    suggestedLevel: "A2-B2",
    description: "Discuss hair extensions (weft, tape-in, keratin bond), lengths, and density.",
    duration: "~10 min",
    bgGradient: "from-emerald-50 to-teal-50",
    radialColor: "from-teal-500/30",
  },
  {
    id: "Salon Small Talk & Checkout",
    title: "Salon Small Talk & Checkout",
    emoji: "💸",
    suggestedLevel: "A2-B2",
    description: "Practice client chit-chat (weekend plans, weather) and handle checkout payments & tipping.",
    duration: "~12 min",
    bgGradient: "from-purple-50 to-indigo-50",
    radialColor: "from-indigo-500/30",
  },
];

const LEVELS = [
  { value: "A1", title: "A1 — Căn bản", desc: "Cụm từ siêu đơn giản, hội thoại ngắn chậm." },
  { value: "A2", title: "A2 — Sơ cấp", desc: "Các chủ đề hàng ngày quen thuộc đơn giản." },
  { value: "B1", title: "B1 — Trung cấp", desc: "Nói rõ ràng về công việc, sở thích, quan điểm." },
  { value: "B2", title: "B2 — Trung cao cấp", desc: "Trình bày chi tiết, lập luận tự nhiên, tốc độ bình thường." },
  { value: "C1", title: "C1 — Cao cấp", desc: "Sử dụng ngôn từ học thuật linh hoạt, đa dạng chủ đề." },
  { value: "C2", title: "C2 — Thành thạo", desc: "Gần như người bản xứ, trôi chảy, phản xạ ngay tức khắc." },
];

export default function ConversationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const { startSession, isLoading, error, setError } = useConversationStore();
  const { isBeautyMode } = useAppModeStore();

  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>("B1");
  const [modalOpen, setModalOpen] = useState<boolean>(false);


  // Authenticate user
  useEffect(() => {
    const checkAuth = async () => {
      await loadUser();
      if (!useAuthStore.getState().isAuthenticated) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [loadUser, router]);

  // Set default level to user's level
  useEffect(() => {
    if (user?.currentLevel) {
      setSelectedLevel(user.currentLevel);
    }
  }, [user]);

  const handleOpenLevelPicker = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setModalOpen(true);
  };

  const handleStartSession = async () => {
    if (!selectedScenario) return;
    try {
      setError(null);
      await startSession(selectedScenario.id, selectedLevel);
      // Wait for store to update activeSession, then route to the page
      const currentActive = useConversationStore.getState().activeSession;
      if (currentActive) {
        router.push(`/conversations/${currentActive.id}`);
      }
    } catch (err) {
      console.error("Failed to start session:", err);
    }
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
      {/* Decorative background blobs */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-primary-fixed-dim/10 blur-[80px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-secondary-fixed-dim/10 blur-[100px]"></div>
      </div>

      {/* Navigation Sidebar */}
      <Sidebar activeItem="conversations" />

      {/* Main Content */}
      <main className="flex-grow md:pl-[280px] mt-16 md:mt-0 p-6 md:p-margin-page relative z-10 overflow-y-auto max-w-container-max mx-auto w-full pb-unit-xl">
        {/* Header Section */}
        <header className="mb-8 flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="text-3xl font-extrabold text-on-surface flex items-center gap-3 justify-center md:justify-start">
            <span className="text-4xl drop-shadow-sm">🗣️</span> 
            AI Conversation Partner
          </h2>
          <p className="text-body-lg text-on-surface-variant mt-2 max-w-2xl text-sm md:text-base">
            Practice real-life English conversations with AI in dynamic, low-pressure scenarios designed to build confidence and fluency.
          </p>
        </header>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-unit-lg">
          {SCENARIOS.filter(s => {
            if (isBeautyMode) {
              return ["Lash Salon Consultation", "Hair Extensions Consultation", "Salon Small Talk & Checkout"].includes(s.id);
            }
            return true;
          }).map((scenario) => (
            <div 
              key={scenario.id} 
              className="bg-surface-container-lowest rounded-[16px] border border-outline-variant/20 overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300 group"
            >

              <div className={`h-40 bg-gradient-to-br ${scenario.bgGradient} flex items-center justify-center border-b border-outline-variant/10 relative overflow-hidden`}>
                <div className={`absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${scenario.radialColor} to-transparent mix-blend-overlay`}></div>
                <span className="text-[80px] group-hover:scale-110 transition-transform duration-500 drop-shadow-sm select-none">
                  {scenario.emoji}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                    {scenario.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-extrabold tracking-wider border border-secondary-container/50 whitespace-nowrap shadow-sm">
                    {scenario.suggestedLevel}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-on-surface-variant flex-1 line-clamp-2 mb-4">
                  {scenario.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-outline mb-5 font-semibold">
                  <div className="flex items-center gap-1 bg-surface-container py-1 px-2.5 rounded-md">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    <span>{scenario.duration}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenLevelPicker(scenario)}
                  className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold shadow-sm hover:shadow-md hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  Start Conversation
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestion Footer */}
        <div className="mt-unit-xl text-center pb-unit-lg">
          <a 
            href="#" 
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-container hover:underline transition-all font-bold py-2 px-4 rounded-lg hover:bg-primary/5"
          >
            <span className="text-base">💡</span>
            Suggest a new scenario
          </a>
        </div>
      </main>

      {/* Level Picker Modal */}
      {modalOpen && selectedScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 md:p-8 border border-outline-variant/30 shadow-2xl relative">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="text-center mb-6">
              <span className="text-4xl mb-2 inline-block">{selectedScenario.emoji}</span>
              <h3 className="text-xl font-extrabold text-on-surface">
                {selectedScenario.title}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Luyện nói tiếng Anh theo chủ đề kịch bản chọn sẵn.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error-container text-error rounded-xl text-xs font-semibold flex items-center gap-2 border border-error/20">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">
                Chọn cấp độ hội thoại của bạn:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {LEVELS.map((lvl) => {
                  const isSelected = selectedLevel === lvl.value;
                  return (
                    <button
                      key={lvl.value}
                      onClick={() => setSelectedLevel(lvl.value)}
                      className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected 
                          ? "border-primary bg-primary/5 ring-1 ring-primary" 
                          : "border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low"
                      }`}
                    >
                      <span className="text-xs font-bold text-on-surface">{lvl.title}</span>
                      <span className="text-[10px] text-on-surface-variant mt-1 leading-normal">{lvl.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-outline-variant/50 hover:bg-surface-container-low font-bold text-sm text-on-surface transition-all active:scale-[0.98] cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                disabled={isLoading}
                onClick={handleStartSession}
                className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-3 px-4 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    Đang khởi tạo...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                    Bắt đầu ngay 🚀
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
