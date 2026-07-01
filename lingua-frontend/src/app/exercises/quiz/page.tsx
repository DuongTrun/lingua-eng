"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useExerciseStore } from "@/store/useExerciseStore";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

export default function ExerciseQuizPage() {
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const {
    topic,
    level,
    questions,
    currentIdx,
    userAnswers,
    answerQuestion,
    nextQuestion,
    setElapsedSeconds,
  } = useExerciseStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Redirect to exercises configuration if no questions are loaded
  useEffect(() => {
    if (!loadingAuth && (!questions || questions.length === 0)) {
      router.push("/exercises");
    }
  }, [questions, loadingAuth, router]);

  // Start timer
  useEffect(() => {
    if (questions && questions.length > 0) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questions]);

  if (loadingAuth || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
      </div>
    );
  }

  const activeQuestion = questions[currentIdx];
  const isAnswered = selectedAnswer !== null;
  const isLastQuestion = currentIdx + 1 === questions.length;

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
    answerQuestion(option);
  };

  const handleNext = async () => {
    if (!isAnswered) return;

    if (isLastQuestion) {
      // Submit score to backend
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(elapsed);

      // Compute total correct score
      let correctScore = 0;
      questions.forEach((q, idx) => {
        const userAnswer = idx === currentIdx ? selectedAnswer : userAnswers[idx];
        if (userAnswer === q.correctAnswer) {
          correctScore++;
        }
      });

      try {
        await api.post("/exercises/submit", {
          topic,
          level,
          score: correctScore,
          total: questions.length,
        });

        router.push("/exercises/result");
      } catch (error) {
        console.error("Failed to submit exercise score:", error);
        alert(error instanceof Error ? error.message : "Có lỗi xảy ra khi nộp điểm!");
        setSubmitting(false);
      }
    } else {
      setSelectedAnswer(null);
      nextQuestion();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper to get option letter A, B, C, D
  const getOptionLetter = (idx: number) => {
    return String.fromCharCode(65 + idx); // 65 is 'A'
  };

  // Render question text replacing blanks with a line
  const renderQuestionText = (text: string) => {
    const parts = text.split(/_{3,}/);
    if (parts.length > 1) {
      return (
        <>
          {parts[0]}
          <span className="inline-block px-4 py-0.5 border-b-2 border-outline-variant mx-1 text-outline font-mono select-none">
            ___
          </span>
          {parts[1]}
        </>
      );
    }
    return text;
  };

  const progressPercent = Math.round(((currentIdx + 1) / questions.length) * 100);

  return (
    <div className="bg-background min-h-screen text-on-surface flex flex-col md:flex-row relative">
      {/* Sidebar Navigation */}
      <Sidebar activeItem="exercises" />

      {/* Main Content */}
      <main className="flex-grow md:pl-[280px] p-6 md:p-margin-page relative min-h-screen flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl flex flex-col gap-6">
          
          {/* Quiz Header */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-on-surface">{topic} — {level}</h2>
              </div>
              <button
                onClick={() => {
                  if (confirm("Bạn có chắc muốn đóng và hủy kết quả bài tập này không?")) {
                    router.push("/exercises");
                  }
                }}
                className="text-on-surface-variant hover:text-error-rose transition-colors p-2 rounded-full hover:bg-surface-variant/50 cursor-pointer"
                title="Đóng bài tập"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Progress and Timer row */}
            <div className="flex items-center justify-between bg-pure-white p-4 rounded-xl border border-outline-variant/30 shadow-sm">
              <div className="flex-1 mr-8">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  <span>Question {currentIdx + 1} of {questions.length}</span>
                  <span className="text-primary font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-surface-variant rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-surface-variant font-mono text-sm font-semibold select-none">
                <span className="material-symbols-outlined text-base leading-none">schedule</span>
                {formatTime(elapsed)}
              </div>
            </div>
          </div>

          {/* Quiz Container */}
          <div className="w-full bg-pure-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden animate-[fadeIn_0.3s_ease-out]">
            {/* Question Area */}
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Question {currentIdx + 1}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-primary/5 text-primary border border-primary/10 select-none">
                  Fill in the blank
                </span>
              </div>
              <h3 className="text-xl font-bold text-on-surface leading-snug">
                {renderQuestionText(activeQuestion.question)}
              </h3>
            </div>

            {/* Options Area */}
            <div className="px-6 md:px-8 pb-6 flex flex-col gap-3">
              {activeQuestion.options.map((option, idx) => {
                const letter = getOptionLetter(idx);
                const isSelected = selectedAnswer === option;
                const isCorrect = option === activeQuestion.correctAnswer;
                
                let buttonStyle = "border-outline-variant bg-pure-white hover:border-primary/50 hover:bg-primary/5";
                let badgeStyle = "bg-surface-container text-on-surface-variant";
                let showCheck = false;
                let showCancel = false;

                if (isAnswered) {
                  if (isCorrect) {
                    buttonStyle = "border-secondary bg-secondary-container/10 cursor-default";
                    badgeStyle = "bg-secondary text-pure-white";
                    showCheck = true;
                  } else if (isSelected) {
                    buttonStyle = "border-error-rose bg-error-container/10 cursor-default";
                    badgeStyle = "bg-error-rose text-pure-white";
                    showCancel = true;
                  } else {
                    buttonStyle = "border-outline-variant/50 bg-pure-white opacity-50 cursor-default";
                    badgeStyle = "bg-surface-container text-on-surface-variant";
                  }
                }

                return (
                  <button
                    key={option}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between group focus:outline-none ${buttonStyle}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors select-none ${badgeStyle}`}>
                        {letter}
                      </div>
                      <span className={`text-sm ${isSelected ? 'font-semibold text-on-surface' : 'text-on-surface'}`}>
                        {option}
                      </span>
                    </div>
                    {showCheck && (
                      <span className="material-symbols-outlined text-secondary font-bold text-2xl select-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    )}
                    {showCancel && (
                      <span className="material-symbols-outlined text-error-rose font-bold text-2xl select-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                        cancel
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback Area */}
            {isAnswered && (
              <div className="bg-surface-container-low border-t border-outline-variant/30 p-6 md:p-8 animate-[slideDown_0.2s_ease-out]">
                <div className="flex flex-col gap-4">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border w-fit text-xs font-bold ${
                    selectedAnswer === activeQuestion.correctAnswer
                      ? "text-[#008a5e] bg-[#e6f7f1] border-[#b3e8d6]"
                      : "text-error-rose bg-error-container/20 border-error-rose/20"
                  }`}>
                    <span className="material-symbols-outlined text-lg leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {selectedAnswer === activeQuestion.correctAnswer ? "check_circle" : "cancel"}
                    </span>
                    <span>
                      {selectedAnswer === activeQuestion.correctAnswer
                        ? "Đáp án chính xác!"
                        : `Đáp án đúng: ${activeQuestion.correctAnswer}`}
                    </span>
                  </div>
                  
                  <div className="bg-pure-white p-4 rounded-xl border border-outline-variant/30 flex gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5 select-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                      lightbulb
                    </span>
                    <div className="text-xs leading-relaxed">
                      <span className="font-bold text-on-surface">Giải thích:</span>{" "}
                      {activeQuestion.explanation}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="w-full flex justify-end">
            <button
              onClick={handleNext}
              disabled={!isAnswered || submitting}
              className={`px-8 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-all duration-150 active:translate-y-px active:scale-95 flex items-center gap-2 select-none ${
                isAnswered
                  ? "bg-primary text-pure-white hover:bg-primary-container shadow-primary/20 hover:shadow-md cursor-pointer"
                  : "bg-surface-container-highest text-on-surface-variant opacity-50 cursor-default"
              }`}
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  Submitting Score...
                </>
              ) : isLastQuestion ? (
                <>
                  Finish Quiz
                  <span className="material-symbols-outlined text-sm leading-none">done</span>
                </>
              ) : (
                <>
                  Next Question
                  <span className="material-symbols-outlined text-sm leading-none">arrow_forward</span>
                </>
              )}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
