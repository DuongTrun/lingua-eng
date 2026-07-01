"use client";

import React, { useEffect, useRef, useCallback } from "react";

// ============================================================
// 📖 Interface: Cấu trúc chi tiết từ vựng trả về từ Gemini API
// ============================================================
export interface WordDetailsData {
  partOfSpeech: string;
  definitionEn: string;
  origin: string;
  synonyms: string[];
  nuance: string;
}

export interface DetailedWord {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  level: string;
  topic: string;
  details: WordDetailsData;
}

// ============================================================
// 🎯 Props cho WordDetailModal
// ============================================================
interface WordDetailModalProps {
  detailedWord: DetailedWord | null;
  modalLoading: boolean;
  modalLanguage: "en" | "vi";
  setModalLanguage: (lang: "en" | "vi") => void;
  flashcardAdded: boolean;
  addingFlashcard: boolean;
  onClose: () => void;
  onAddToFlashcards: () => void;
  onSearchSynonym: (synonym: string) => void;
  onSpeakWord: (word: string) => void;
  onNavigateToSpeaking: (word: string) => void;
}

/**
 * 💎 WordDetailModal — Cửa sổ tra cứu chi tiết từ vựng (Dictionary Search)
 *
 * Features:
 * - Escape key listener để đóng modal
 * - Scroll lock body khi modal mở
 * - Focus trap cơ bản (auto-focus vào modal container)
 * - Click outside backdrop để đóng
 * - Glassmorphic light theme
 */
export default function WordDetailModal({
  detailedWord,
  modalLoading,
  modalLanguage,
  setModalLanguage,
  flashcardAdded,
  addingFlashcard,
  onClose,
  onAddToFlashcards,
  onSearchSynonym,
  onSpeakWord,
  onNavigateToSpeaking,
}: WordDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // 🔑 Escape key listener + Scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    // Auto-focus modal container cho accessibility
    modalRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // 🖱️ Click ngoài backdrop để đóng
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // 📌 Cuộn mượt tới AI Nuance Box kèm hiệu ứng highlight
  const scrollToNuance = useCallback(() => {
    const nuanceElement = document.getElementById("ai-nuance-box");
    if (nuanceElement) {
      nuanceElement.scrollIntoView({ behavior: "smooth" });
      nuanceElement.classList.add("ring-2", "ring-primary", "animate-pulse");
      setTimeout(() => {
        nuanceElement.classList.remove("ring-2", "ring-primary", "animate-pulse");
      }, 3000);
    }
  }, []);

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white/95 backdrop-blur-2xl border border-slate-200/60 shadow-2xl shadow-slate-200/50 rounded-3xl p-5 md:p-7 relative overflow-hidden max-w-3xl w-full max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] text-slate-800 outline-none"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        {modalLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
            <p className="text-sm text-slate-500 mt-4 font-bold">Gemini đang giải nghĩa chi tiết...</p>
          </div>
        ) : detailedWord ? (
          <div className="relative z-10 text-left">
            {/* Header: Word & Pronunciation */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2 select-all">
                  {detailedWord.word}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="font-mono-code text-primary bg-primary/5 px-2.5 py-0.5 rounded-lg border border-primary/15 text-[11px] font-semibold">
                    {detailedWord.ipa}
                  </span>

                  {/* Loa phát âm */}
                  <button
                    onClick={() => onSpeakWord(detailedWord.word)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-primary transition-colors border border-slate-200/40 shadow-sm cursor-pointer"
                    title="Nghe phát âm"
                  >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      volume_up
                    </span>
                  </button>

                  {/* Luyện nói AI */}
                  <button
                    onClick={() => onNavigateToSpeaking(detailedWord.word)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors border border-slate-200/40 shadow-sm cursor-pointer"
                    title="Luyện nói AI"
                  >
                    <span className="material-symbols-outlined text-lg">graphic_eq</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={onAddToFlashcards}
                  disabled={flashcardAdded || addingFlashcard}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-[11px] transition-all shadow-sm cursor-pointer active:scale-95 ${
                    flashcardAdded
                      ? "bg-emerald-500 text-white shadow-emerald-100"
                      : "bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/20"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {flashcardAdded ? "check" : "add"}
                  </span>
                  {flashcardAdded ? "Đã thêm" : "Thêm Flashcard"}
                </button>

                {/* AI Nuance Quick Button */}
                <button
                  onClick={scrollToNuance}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-[11px] hover:bg-slate-200 transition-all border border-slate-200/50 shadow-sm transform active:scale-95 group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-amber-500 group-hover:rotate-12 transition-transform text-sm">
                    auto_awesome
                  </span>
                  AI Nuance
                </button>
              </div>
            </div>

            {/* Definitions Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Col: Definitions (Wider) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Language Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl inline-flex border border-slate-200/40">
                  <button
                    onClick={() => setModalLanguage("en")}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                      modalLanguage === "en"
                        ? "bg-white text-slate-800 shadow-sm border border-slate-200/20"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setModalLanguage("vi")}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                      modalLanguage === "vi"
                        ? "bg-white text-slate-800 shadow-sm border border-slate-200/20"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Tiếng Việt
                  </button>
                </div>

                {/* Definition Block */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
                      {detailedWord.details.partOfSpeech}
                    </span>
                  </div>

                  <p className="text-base md:text-lg font-bold text-slate-800 leading-snug">
                    {modalLanguage === "en" ? detailedWord.details.definitionEn : detailedWord.meaning}
                  </p>

                  {/* Example Box */}
                  <div className="bg-slate-50/80 border-l-4 border-primary p-4 rounded-r-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-xs md:text-sm text-slate-600 italic relative z-10 leading-relaxed font-medium">
                      {modalLanguage === "en" ? (
                        <>&ldquo;{detailedWord.example}&rdquo;</>
                      ) : (
                        <>&ldquo;{detailedWord.exampleMeaning}&rdquo;</>
                      )}
                    </p>
                  </div>
                </div>

                {/* AI Nuance Box */}
                <div id="ai-nuance-box" className="bg-amber-50/40 border border-amber-200/50 rounded-2xl p-4 flex gap-3 items-start mt-4 transition-all duration-500">
                  <span className="material-symbols-outlined text-amber-500 text-xl shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                    auto_awesome
                  </span>
                  <div>
                    <h4 className="font-extrabold text-xs text-amber-800 flex items-center gap-1.5">
                      Sắc thái sử dụng từ (AI Nuance)
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-1 font-medium">
                      {detailedWord.details.nuance}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Col: Synonyms, Origin & Mastery */}
              <div className="space-y-4">
                {/* Synonyms Box */}
                <div className="bg-slate-50/85 rounded-2xl p-4 border border-slate-200/50">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">compare_arrows</span>
                    Từ đồng nghĩa (Synonyms)
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {detailedWord.details.synonyms && detailedWord.details.synonyms.length > 0 ? (
                      detailedWord.details.synonyms.map((syn: string, idx: number) => (
                        <span
                          key={idx}
                          onClick={() => onSearchSynonym(syn)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 cursor-pointer transition-colors shadow-sm"
                        >
                          {syn}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Không có từ đồng nghĩa.</span>
                    )}
                  </div>
                </div>

                {/* Origin/Etymology Box */}
                <div className="bg-slate-50/85 rounded-2xl p-4 border border-slate-200/50">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">history_edu</span>
                    Nguồn gốc từ (Origin)
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    {detailedWord.details.origin}
                  </p>
                </div>

                {/* Progress/Mastery visual indicator */}
                <div className="bg-slate-50/85 rounded-2xl p-4 border border-slate-200/50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Độ làm chủ từ vựng
                  </span>
                  <div className="flex gap-1">
                    <div className="w-8 h-1.5 rounded-full bg-primary animate-pulse"></div>
                    <div className="w-8 h-1.5 rounded-full bg-slate-200"></div>
                    <div className="w-8 h-1.5 rounded-full bg-slate-200"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-error text-5xl mb-4">error</span>
            <p className="text-slate-800 font-bold">Không thể tải thông tin từ vựng.</p>
          </div>
        )}
      </div>
    </div>
  );
}
