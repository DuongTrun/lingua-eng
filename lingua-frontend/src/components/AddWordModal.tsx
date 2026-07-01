"use client";

import React, { useState, useRef, useEffect } from "react";

// ============================================================
// 📖 Interface cho kết quả từ AI
// ============================================================
interface AddedWord {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  level: string;
  topic: string;
  partOfSpeech?: string;
}

interface AddWordResult {
  existed: boolean;
  word: AddedWord;
}

// ============================================================
// 🎯 Props cho AddWordModal
// ============================================================
interface AddWordModalProps {
  onClose: () => void;
  onWordAdded: () => void; // Callback để reload danh sách từ
}

/**
 * ➕ AddWordModal — Modal thêm từ vựng thủ công
 *
 * User nhập từ tiếng Anh → Gọi API → AI Gemini tự động sinh IPA, nghĩa,
 * ví dụ, loại từ → Hiển thị preview kết quả
 */
export default function AddWordModal({ onClose, onWordAdded }: AddWordModalProps) {
  const [inputWord, setInputWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AddWordResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input khi mở modal
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ============================================================
  // 🚀 Gửi request thêm từ
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputWord.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { api } = await import("@/lib/api");
      const response = await api.post("/words/add-custom", { word: trimmed });
      setResult(response.data);

      // Nếu từ mới được thêm thành công → reload danh sách
      if (!response.data.existed) {
        onWordAdded();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại!";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // 🔄 Reset để nhập từ mới
  // ============================================================
  const handleAddAnother = () => {
    setInputWord("");
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  };

  // ============================================================
  // 🎨 Render
  // ============================================================
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative bg-pure-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-outline-variant/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5 text-pure-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                add_circle
              </span>
              <div>
                <h2 className="text-lg font-extrabold">Thêm từ vựng mới</h2>
                <p className="text-pure-white/70 text-xs mt-0.5">
                  AI sẽ tự động sinh phát âm, nghĩa và ví dụ
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-pure-white/20 hover:bg-pure-white/30 flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Input Form */}
          {!result && (
            <form onSubmit={handleSubmit}>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">
                Nhập từ tiếng Anh
              </label>
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputWord}
                  onChange={(e) => setInputWord(e.target.value)}
                  placeholder="Ví dụ: serendipity, ubiquitous..."
                  className="flex-1 px-4 py-3 bg-surface border border-outline-variant/40 rounded-xl text-sm font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  disabled={loading}
                  maxLength={100}
                />
                <button
                  type="submit"
                  disabled={!inputWord.trim() || loading}
                  className="px-5 py-3 bg-primary text-pure-white font-bold rounded-xl text-sm transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shrink-0"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-base animate-spin">
                        sync
                      </span>
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        auto_awesome
                      </span>
                      Thêm từ
                    </>
                  )}
                </button>
              </div>

              {/* Loading hint */}
              {loading && (
                <p className="text-xs text-on-surface-variant mt-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm animate-spin">
                    sync
                  </span>
                  AI đang phân tích và sinh thông tin cho từ &ldquo;{inputWord.trim()}&rdquo;...
                </p>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 bg-error/5 border border-error/20 rounded-xl p-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-error text-lg shrink-0 mt-0.5">
                    error
                  </span>
                  <p className="text-sm text-error font-medium">{error}</p>
                </div>
              )}
            </form>
          )}

          {/* Result Preview */}
          {result && (
            <div className="space-y-4">
              {/* Status Badge */}
              {result.existed ? (
                <div className="bg-tertiary/5 border border-tertiary/20 rounded-xl p-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-tertiary text-lg shrink-0 mt-0.5">
                    info
                  </span>
                  <p className="text-sm text-tertiary font-semibold">
                    Từ &ldquo;{result.word.word}&rdquo; đã có sẵn trong thư viện từ vựng!
                  </p>
                </div>
              ) : (
                <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 flex items-start gap-3">
                  <span
                    className="material-symbols-outlined text-secondary text-lg shrink-0 mt-0.5"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <p className="text-sm text-secondary font-semibold">
                    Đã thêm thành công từ &ldquo;{result.word.word}&rdquo; vào thư viện!
                  </p>
                </div>
              )}

              {/* Word Preview Card */}
              <div className="bg-surface rounded-2xl border border-outline-variant/30 p-5">
                {/* Badges */}
                <div className="flex gap-1.5 mb-3">
                  <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold rounded-md uppercase">
                    {result.word.level}
                  </span>
                  <span className="px-2.5 py-0.5 bg-secondary/10 text-secondary text-[10px] font-extrabold rounded-md uppercase">
                    {result.word.topic}
                  </span>
                  {result.word.partOfSpeech && (
                    <span className="px-2.5 py-0.5 bg-tertiary/10 text-tertiary text-[10px] font-extrabold rounded-md uppercase">
                      {result.word.partOfSpeech}
                    </span>
                  )}
                </div>

                {/* Word & IPA */}
                <h3 className="text-xl font-black text-on-surface">
                  {result.word.word}
                </h3>
                <p className="text-sm font-semibold text-outline font-phonetic mt-0.5">
                  {result.word.ipa}
                </p>

                {/* Meaning */}
                <p className="text-sm font-extrabold text-secondary mt-2.5">
                  {result.word.meaning}
                </p>

                {/* Example */}
                <div className="bg-pure-white p-3.5 rounded-xl border border-surface-variant/40 mt-4 text-xs">
                  <p className="font-bold text-on-surface leading-relaxed">
                    &ldquo;{result.word.example}&rdquo;
                  </p>
                  <p className="text-on-surface-variant italic mt-1">
                    &ldquo;{result.word.exampleMeaning}&rdquo;
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddAnother}
                  className="flex-1 py-3 bg-surface border border-outline-variant/40 text-on-surface font-bold rounded-xl text-sm hover:bg-surface-container-high transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Thêm từ khác
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-primary text-pure-white font-bold rounded-xl text-sm hover:bg-primary/90 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">done</span>
                  Hoàn tất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
