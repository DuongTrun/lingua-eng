"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useExerciseStore } from "@/store/useExerciseStore";
import Sidebar from "@/components/Sidebar";

export default function ExerciseResultPage() {
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const {
    topic,
    level,
    questions,
    userAnswers,
    elapsedSeconds,
    resetQuiz,
  } = useExerciseStore();

  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const loadingAuth = !isAuthenticated || !user;

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

  // Redirect if no questions
  useEffect(() => {
    if (!loadingAuth && (!questions || questions.length === 0)) {
      router.push("/exercises");
    }
  }, [questions, loadingAuth, router]);

  if (loadingAuth || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
      </div>
    );
  }

  // Calculations
  let correctCount = 0;
  questions.forEach((q, idx) => {
    if (userAnswers[idx] === q.correctAnswer) {
      correctCount++;
    }
  });

  const incorrectCount = questions.length - correctCount;
  const scorePercent = Math.round((correctCount / questions.length) * 100);
  const avgTimePerQuestion = Math.round(elapsedSeconds / questions.length);

  // SVG ring parameters
  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius; // 251.3
  const strokeDashoffset = circumference - (circumference * scorePercent) / 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getOptionLetter = (idx: number) => {
    return String.fromCharCode(65 + idx);
  };

  const handleTryAgain = () => {
    resetQuiz();
    router.push("/exercises/quiz");
  };

  const handleNewExercise = () => {
    router.push("/exercises");
  };

  const toggleExpandRow = (idx: number) => {
    setExpandedRow((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="bg-background min-h-screen text-on-surface flex flex-col md:flex-row relative">
      {/* Sidebar Navigation */}
      <Sidebar activeItem="exercises" />

      {/* Main Content Area */}
      <main className="flex-grow md:pl-[280px] p-6 md:p-margin-page relative min-h-screen flex flex-col justify-center bg-surface">
        <div className="w-full max-w-4xl mx-auto space-y-unit-xl pb-unit-xl">
          
          <div className="bg-pure-white rounded-[24px] shadow-sm border border-outline-variant/30 p-6 md:p-12 glass-panel transition-all hover:shadow-md animate-[fadeIn_0.4s_ease-out]">
            {/* Header Section */}
            <div className="text-center mb-10">
              <div className="text-5xl leading-none mb-4 select-none">
                {scorePercent >= 80 ? "🎉" : "💪"}
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-2">
                {correctCount}/{questions.length} Correct!
              </h2>
              <p className="text-sm text-on-surface-variant font-semibold">
                {topic} — {level} &bull; Time taken: {formatTime(elapsedSeconds)}
              </p>
            </div>

            {/* Stats Overview */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 mb-12">
              {/* Progress Ring */}
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-95" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    className="text-surface-container stroke-current"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r={radius}
                    strokeWidth={strokeWidth}
                  ></circle>
                  {/* Progress circle */}
                  <circle
                    className={`${scorePercent >= 80 ? 'text-secondary' : 'text-primary'} stroke-current transition-all duration-1000 ease-out`}
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-on-surface">{scorePercent}%</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Score</span>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="flex flex-row gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <div className="bg-surface-container-low rounded-xl p-4 flex-1 md:w-32 flex flex-col items-center justify-center border border-outline-variant/20 text-center shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <span className="text-xl font-bold text-on-surface">{correctCount}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Correct</span>
                </div>
                <div className="bg-surface-container-low rounded-xl p-4 flex-1 md:w-32 flex flex-col items-center justify-center border border-outline-variant/20 text-center shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-error-rose/10 text-error-rose flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                  </div>
                  <span className="text-xl font-bold text-on-surface">{incorrectCount}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Incorrect</span>
                </div>
                <div className="bg-surface-container-low rounded-xl p-4 flex-1 md:w-32 flex flex-col items-center justify-center border border-outline-variant/20 text-center shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                  </div>
                  <span className="text-xl font-bold text-on-surface">{avgTimePerQuestion}s</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Avg. Time</span>
                </div>
              </div>
            </div>

            {/* Question Breakdown Table */}
            <div className="mb-10">
              <h3 className="text-lg font-bold text-on-surface mb-4">Detailed Breakdown</h3>
              <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-pure-white shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/30">
                      <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">#</th>
                      <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Question Preview</th>
                      <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-center">Status</th>
                      <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-outline-variant/20">
                    {questions.map((q, idx) => {
                      const isCorrect = userAnswers[idx] === q.correctAnswer;
                      const isExpanded = expandedRow === idx;

                      return (
                        <React.Fragment key={idx}>
                          <tr className="hover:bg-surface-container-low/50 transition-colors group">
                            <td className="py-4 px-4 text-on-surface-variant">{idx + 1}</td>
                            <td className="py-4 px-4 text-on-surface font-medium truncate max-w-[200px] md:max-w-md">
                              {q.question}
                            </td>
                            <td className="py-4 px-4 text-center">
                              {isCorrect ? (
                                <span className="material-symbols-outlined text-secondary text-xl leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  check_circle
                                </span>
                              ) : (
                                <span className="material-symbols-outlined text-error-rose text-xl leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  cancel
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => toggleExpandRow(idx)}
                                className="text-primary hover:text-primary-container text-xs font-bold underline focus:outline-none cursor-pointer"
                              >
                                {isExpanded ? "Close" : "Review"}
                              </button>
                            </td>
                          </tr>
                          
                          {/* Expanded review row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={4} className="bg-surface-container-low/30 px-6 py-4 border-b border-outline-variant/20">
                                <div className="space-y-3 text-xs">
                                  <p className="font-bold text-on-surface text-sm">{q.question}</p>
                                  
                                  {/* Render options list */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 my-2">
                                    {q.options.map((opt, optIdx) => {
                                      const optLetter = getOptionLetter(optIdx);
                                      const wasSelected = userAnswers[idx] === opt;
                                      const isOptCorrect = q.correctAnswer === opt;
                                      
                                      let optStyle = "border-outline-variant bg-pure-white";
                                      if (isOptCorrect) {
                                        optStyle = "border-secondary bg-secondary-container/10 font-semibold text-secondary";
                                      } else if (wasSelected) {
                                        optStyle = "border-error-rose bg-error-container/10 font-semibold text-error-rose";
                                      }

                                      return (
                                        <div key={opt} className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${optStyle}`}>
                                          <span className="font-bold select-none">{optLetter}.</span>
                                          <span>{opt}</span>
                                          {isOptCorrect && <span className="material-symbols-outlined text-sm leading-none ml-auto">check_circle</span>}
                                          {wasSelected && !isOptCorrect && <span className="material-symbols-outlined text-sm leading-none ml-auto">cancel</span>}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="bg-pure-white p-4 rounded-xl border border-outline-variant/30 flex gap-2.5 text-on-surface-variant">
                                    <span className="material-symbols-outlined text-amber-500 text-base flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                                      lightbulb
                                    </span>
                                    <div>
                                      <span className="font-bold text-on-surface">Giải thích:</span>{" "}
                                      {q.explanation}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col items-center gap-6 border-t border-outline-variant/30 pt-8">
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button
                  onClick={handleTryAgain}
                  className="px-8 py-3 rounded-lg border border-primary text-primary font-bold text-xs hover:bg-primary/5 transition-colors w-full sm:w-auto active:translate-y-px"
                >
                  Try Again
                </button>
                <button
                  onClick={handleNewExercise}
                  className="px-8 py-3 rounded-lg bg-primary text-pure-white font-bold text-xs hover:bg-primary/95 transition-colors shadow-sm hover:shadow-md w-full sm:w-auto active:translate-y-px"
                >
                  New Exercise
                </button>
              </div>
              <p className="text-xs text-on-surface-variant font-medium italic text-center max-w-md select-none">
                {scorePercent >= 80
                  ? '"Great job! You\'re making progress. Keep practicing! 🚀"'
                  : '"Keep practicing! Every mistake is a learning opportunity. You can do it! 🚀"'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
