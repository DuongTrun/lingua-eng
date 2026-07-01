"use client";

import React from "react";

// ============================================================
// 📖 Interface: Cấu trúc từ vựng cơ bản
// ============================================================
export interface Word {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  level: string;
  topic: string;
}

// ============================================================
// 🎯 Props cho WordCard
// ============================================================
interface WordCardProps {
  word: Word;
  topicLabel: string;
  onWordClick: (wordId: string) => void;
  onSpeakWord: (wordText: string) => void;
}

/**
 * 🃏 WordCard — Thẻ từ vựng hiển thị trong lưới
 *
 * Hiển thị: word, IPA, meaning, example, level badge, topic badge
 * Hỗ trợ: click để mở modal chi tiết, click loa để phát âm
 */
export default function WordCard({ word, topicLabel, onWordClick, onSpeakWord }: WordCardProps) {
  return (
    <div
      onClick={() => onWordClick(word.id)}
      className="bg-pure-white hover:shadow-md hover:border-primary/30 transition-all rounded-2xl p-5 border border-outline-variant/30 flex flex-col justify-between cursor-pointer group"
    >
      <div>
        {/* Badge and Speaker Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1.5">
            <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold rounded-md uppercase">
              {word.level}
            </span>
            <span className="px-2.5 py-0.5 bg-secondary/10 text-secondary text-[10px] font-extrabold rounded-md uppercase">
              {topicLabel}
            </span>
          </div>

          {/* Loa phát âm */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Ngăn mở modal chi tiết
              onSpeakWord(word.word);
            }}
            className="w-8 h-8 rounded-full bg-primary/5 hover:bg-primary/10 text-primary flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title="Nghe phát âm"
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              volume_up
            </span>
          </button>
        </div>

        {/* Word, IPA & Meaning */}
        <h3 className="text-xl font-black text-on-surface select-all group-hover:text-primary transition-colors">{word.word}</h3>
        <p className="text-sm font-semibold text-outline font-phonetic mt-0.5">{word.ipa}</p>
        <p className="text-sm font-extrabold text-secondary mt-2.5">{word.meaning}</p>

        {/* Example Box */}
        <div className="bg-surface p-3.5 rounded-xl border border-surface-variant/40 mt-4 text-xs">
          <p className="font-bold text-on-surface leading-relaxed">&ldquo;{word.example}&rdquo;</p>
          <p className="text-on-surface-variant italic mt-1">&ldquo;{word.exampleMeaning}&rdquo;</p>
        </div>
      </div>
    </div>
  );
}
