"use client";

import React, { useMemo } from "react";

// ============================================================
// 🎯 Props cho PaginationControls
// ============================================================
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * 📄 PaginationControls — Điều khiển phân trang
 *
 * Features:
 * - Memoize danh sách page numbers (tránh recompute mỗi render)
 * - Hiển thị tối đa 5 số trang liên tiếp
 * - Nút First/Last page với dấu "..." khi cần
 */
export default function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  // Memoize danh sách số trang hiển thị (fix P-1: tránh gọi lại 4 lần mỗi render)
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10 max-w-6xl">
      {/* Previous Page */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-10 h-10 rounded-xl bg-pure-white border border-outline-variant/30 flex items-center justify-center hover:bg-surface disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
        title="Trang trước"
      >
        <span className="material-symbols-outlined text-lg">chevron_left</span>
      </button>

      {/* First Page + Ellipsis */}
      {pageNumbers[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className={`w-10 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentPage === 1
                ? "bg-primary text-pure-white shadow-sm"
                : "bg-pure-white border border-outline-variant/30 hover:bg-surface"
            }`}
          >
            1
          </button>
          {pageNumbers[0] > 2 && (
            <span className="text-outline text-xs px-1 select-none">...</span>
          )}
        </>
      )}

      {/* Page Numbers */}
      {pageNumbers.map((pNum) => (
        <button
          key={pNum}
          onClick={() => onPageChange(pNum)}
          className={`w-10 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentPage === pNum
              ? "bg-primary text-pure-white shadow-sm"
              : "bg-pure-white border border-outline-variant/30 hover:bg-surface"
          }`}
        >
          {pNum}
        </button>
      ))}

      {/* Last Page + Ellipsis */}
      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className="text-outline text-xs px-1 select-none">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className={`w-10 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentPage === totalPages
                ? "bg-primary text-pure-white shadow-sm"
                : "bg-pure-white border border-outline-variant/30 hover:bg-surface"
            }`}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Page */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="w-10 h-10 rounded-xl bg-pure-white border border-outline-variant/30 flex items-center justify-center hover:bg-surface disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
        title="Trang sau"
      >
        <span className="material-symbols-outlined text-lg">chevron_right</span>
      </button>
    </div>
  );
}
