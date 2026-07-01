"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useExerciseStore } from "@/store/useExerciseStore";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

const TENSES = [
  "Present Simple",
  "Present Continuous",
  "Past Simple",
  "Past Continuous",
  "Present Perfect",
  "Past Perfect",
  "Future Simple",
  "Future Perfect",
];

const STRUCTURES = [
  "Passive Voice",
  "Reported Speech",
  "Conditionals",
  "Relative Clauses",
  "Modal Verbs",
];

const LEVELS = [
  { code: "A1", label: "Beginner" },
  { code: "A2", label: "Elementary" },
  { code: "B1", label: "Intermediate" },
  { code: "B2", label: "Upper-Int" },
  { code: "C1", label: "Advanced" },
  { code: "C2", label: "Proficiency" },
];

const COUNTS = [5, 10, 15, 20];

export default function ExerciseSelectPage() {
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const { setSelections, setQuestions } = useExerciseStore();

  const [selectedTopic, setSelectedTopic] = useState("Present Perfect");
  const [selectedLevel, setSelectedLevel] = useState("B1");
  const [selectedCount, setSelectedCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    setErrorMsg("");

    try {
      // 1. Generate questions from Backend
      const response = await api.post("/exercises/generate", {
        topic: selectedTopic,
        level: selectedLevel,
        count: selectedCount,
      });

      const questions = response.data;
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Không thể sinh câu hỏi. Vui lòng thử lại!");
      }

      // 2. Save selections and questions to store
      setSelections(selectedTopic, selectedLevel, selectedCount);
      setQuestions(questions);

      // 3. Navigate to quiz page
      router.push("/exercises/quiz");
    } catch (err) {
      console.error("Failed to generate exercise:", err);
      setErrorMsg(err instanceof Error ? err.message : "Có lỗi xảy ra khi gọi AI sinh đề!");
      setGenerating(false);
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
      {/* Sidebar Navigation */}
      <Sidebar activeItem="exercises" />

      {/* Main Content Area */}
      <main className="flex-grow md:pl-[280px] mt-16 md:mt-0 p-6 md:p-margin-page relative z-10 overflow-y-auto max-w-container-max mx-auto w-full">
        {/* TopNavBar - Only show on desktop since mobile has Sidebar TopBar */}
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

        <div className="max-w-4xl mx-auto space-y-unit-xl pb-unit-xl">
          {/* Page Header */}
          <div className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-extrabold text-on-surface mb-2 flex items-center justify-center md:justify-start gap-2">
              <span>🧠 AI Grammar Exercises</span>
            </h2>
            <p className="text-body-lg text-on-surface-variant text-sm">Practice grammar with auto-generated exercises tailored to your level.</p>
          </div>

          {errorMsg && (
            <div className="bg-error/10 border border-error/20 text-error p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              {errorMsg}
            </div>
          )}

          {/* Section 1: Choose Grammar Topic */}
          <section className="bg-pure-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 md:p-8 border border-outline-variant/30 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors duration-300"></div>
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">category</span>
              1. Choose Grammar Topic
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">Tenses</h4>
                <div className="flex flex-wrap gap-2.5">
                  {TENSES.map((t) => {
                    const isSelected = selectedTopic === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setSelectedTopic(t)}
                        className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all focus:outline-none ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary bg-pure-white"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">Structures</h4>
                <div className="flex flex-wrap gap-2.5">
                  {STRUCTURES.map((s) => {
                    const isSelected = selectedTopic === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSelectedTopic(s)}
                        className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all focus:outline-none ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary bg-pure-white"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Choose Difficulty Level */}
          <section className="bg-pure-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 md:p-8 border border-outline-variant/30 relative group hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors duration-300"></div>
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">signal_cellular_alt</span>
              2. Choose Difficulty Level
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {LEVELS.map((lvl) => {
                const isSelected = selectedLevel === lvl.code;
                return (
                  <label key={lvl.code} className="cursor-pointer">
                    <input
                      type="radio"
                      name="difficulty"
                      value={lvl.code}
                      checked={isSelected}
                      onChange={() => setSelectedLevel(lvl.code)}
                      className="sr-only"
                    />
                    <div
                      className={`rounded-xl border p-4 text-center hover:bg-surface-container-low transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                          : "border-outline-variant bg-pure-white"
                      }`}
                    >
                      <div className={`text-2xl font-bold mb-1 ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                        {lvl.code}
                      </div>
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {lvl.label}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Section 3: Number of Questions */}
          <section className="bg-pure-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 md:p-8 border border-outline-variant/30 relative group hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors duration-300"></div>
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">format_list_numbered</span>
              3. Number of Questions
            </h3>
            
            <div className="flex flex-wrap gap-4">
              {COUNTS.map((c) => {
                const isSelected = selectedCount === c;
                return (
                  <label key={c} className="cursor-pointer flex-1 min-w-[80px]">
                    <input
                      type="radio"
                      name="questions"
                      value={c}
                      checked={isSelected}
                      onChange={() => setSelectedCount(c)}
                      className="sr-only"
                    />
                    <div
                      className={`px-6 py-3 rounded-lg border text-center font-bold text-sm transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-outline-variant bg-pure-white text-on-surface hover:bg-surface-container-low"
                      }`}
                    >
                      {c}
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Action Area */}
          <div className="flex flex-col items-center justify-center pt-8">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full max-w-[400px] bg-primary text-pure-white py-4 px-8 rounded-xl text-md font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95 flex justify-center items-center gap-2.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {generating ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  AI is creating questions...
                </>
              ) : (
                <>
                  Generate Exercises 🚀
                </>
              )}
            </button>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1 justify-center opacity-85 select-none">
              <span className="material-symbols-outlined text-amber-500 text-sm leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              Powered by Gemini AI — exercises are unique every time
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
