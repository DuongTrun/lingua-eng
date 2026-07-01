"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import WordCard, { Word } from "@/components/WordCard";
import WordDetailModal, { DetailedWord } from "@/components/WordDetailModal";
import PaginationControls from "@/components/PaginationControls";
import AddWordModal from "@/components/AddWordModal";

// ============================================================
// 📖 Interfaces
// ============================================================
interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

// ============================================================
// 🏷️ Bảng dịch chủ đề sang tiếng Việt (module-level constant)
// ============================================================
const TOPIC_TRANSLATIONS: Record<string, string> = {
  All: "Tất cả",
  Art: "Nghệ thuật",
  Beauty: "Làm đẹp",
  Business: "Kinh doanh",
  "Daily Life": "Giao tiếp hàng ngày",
  Education: "Giáo dục",
  Entertainment: "Giải trí",
  Family: "Gia đình",
  Food: "Ẩm thực",
  Health: "Sức khỏe",
  Nature: "Thiên nhiên",
  Science: "Khoa học",
  Shopping: "Mua sắm",
  Socializing: "Giao tiếp xã hội",
  Sports: "Thể thao",
  Technology: "Công nghệ",
  Travel: "Du lịch",
};

const LEVELS = ["All", "A1", "A2", "B1", "B2", "C1", "C2"] as const;

// ============================================================
// 🚀 VocabularyLibraryPage — Trang chính Thư viện Từ vựng
// ============================================================
export default function VocabularyLibraryPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, loadUser } = useAuthStore();

  // Danh sách từ vựng & phân trang
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 20,
    totalPages: 1,
    totalItems: 0,
  });

  // Danh sách chủ đề từ API (dynamic, fix C-1)
  const [topics, setTopics] = useState<string[]>([]);

  // States cho Dictionary Detail Modal
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [detailedWord, setDetailedWord] = useState<DetailedWord | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalLanguage, setModalLanguage] = useState<"en" | "vi">("en");
  const [flashcardAdded, setFlashcardAdded] = useState(false);
  const [addingFlashcard, setAddingFlashcard] = useState(false);

  // State cho AddWordModal
  const [showAddModal, setShowAddModal] = useState(false);

  // Ref cho debounce timer
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ============================================================
  // 🔐 Kiểm tra đăng nhập
  // ============================================================
  useEffect(() => {
    const checkAuth = async () => {
      await loadUser();
      if (!useAuthStore.getState().isAuthenticated) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [loadUser, router]);

  // ============================================================
  // 🏷️ Fetch danh sách chủ đề động từ API (fix C-1: không hardcode)
  // ============================================================
  useEffect(() => {
    const fetchTopics = async () => {
      if (!isAuthenticated || !token) return;
      try {
        const response = await api.get("/words/topics");
        setTopics(response.data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách chủ đề:", error);
        // Fallback: không có chủ đề nào hiển thị trong dropdown
      }
    };
    fetchTopics();
  }, [isAuthenticated, token]);

  // ============================================================
  // ⏱️ Debounce search (fix N-1: tránh gọi API mỗi keystroke)
  // ============================================================
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [search]);

  // ============================================================
  // 📖 Load danh sách từ vựng từ API
  // ============================================================
  const fetchWords = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "18"); // Hiển thị 18 từ mỗi trang dạng lưới 3 cột

      if (levelFilter !== "All") params.append("level", levelFilter);
      if (topicFilter !== "All") params.append("topic", topicFilter);
      if (debouncedSearch.trim() !== "") params.append("search", debouncedSearch);

      const response = await api.get(`/words?${params.toString()}`);
      setWords(response.data.items);
      setMeta(response.data.meta);
    } catch (error) {
      console.error("Lỗi khi tải từ vựng:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, currentPage, levelFilter, topicFilter, debouncedSearch]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  // ============================================================
  // 🔍 Mở chi tiết từ vựng (Gemini AI)
  // ============================================================
  const handleWordClick = useCallback(async (wordId: string) => {
    setSelectedWordId(wordId);
    setModalLoading(true);
    setDetailedWord(null);
    setFlashcardAdded(false);
    setModalLanguage("en");

    try {
      const response = await api.get(`/words/${wordId}/details`);
      setDetailedWord(response.data);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết từ vựng từ Gemini:", error);
    } finally {
      setModalLoading(false);
    }
  }, []);

  // ============================================================
  // ➕ Thêm vào Flashcard
  // ============================================================
  const handleAddToFlashcards = useCallback(async () => {
    if (!selectedWordId || addingFlashcard) return;
    setAddingFlashcard(true);
    try {
      await api.post("/flashcards/review", {
        wordId: selectedWordId,
        quality: 4, // 4 tương đương với "Good" (nhớ được) trong thuật toán SM-2
      });
      setFlashcardAdded(true);
    } catch (error) {
      console.error("Lỗi khi thêm vào Flashcard:", error);
    } finally {
      setAddingFlashcard(false);
    }
  }, [selectedWordId, addingFlashcard]);

  // ============================================================
  // 🎯 Handlers cho bộ lọc
  // ============================================================
  const handleLevelChange = (lvl: string) => {
    setLevelFilter(lvl);
    setCurrentPage(1);
  };

  const handleTopicChange = (topic: string) => {
    setTopicFilter(topic);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // 🔊 Phát âm từ vựng (TTS)
  const speakWord = useCallback((wordText: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // 🗣️ Chuyển tới Speaking Coach
  const handleNavigateToSpeaking = useCallback(
    (word: string) => {
      router.push(`/speaking`);
    },
    [router]
  );

  // 🔗 Click synonym trong modal -> tìm kiếm từ đó
  const handleSearchSynonym = useCallback((synonym: string) => {
    setSearch(synonym);
    setSelectedWordId(null);
    setCurrentPage(1);
  }, []);

  // Đóng modal
  const handleCloseModal = useCallback(() => {
    setSelectedWordId(null);
  }, []);

  // ============================================================
  // 🔄 Loading screen khi chưa đăng nhập
  // ============================================================
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
      </div>
    );
  }

  // ============================================================
  // 🎨 Render
  // ============================================================
  return (
    <div className="bg-background min-h-screen text-on-surface flex flex-col md:flex-row relative">
      {/* Sidebar */}
      <Sidebar activeItem="vocabulary" />

      {/* Main Content */}
      <main className="flex-grow md:pl-[280px] mt-16 md:mt-0 p-6 md:p-margin-page relative min-h-screen">
        {/* Header */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface flex items-center gap-2 select-none">
              <span className="material-symbols-outlined text-primary text-3xl">menu_book</span>
              Thư viện Từ vựng
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Tra cứu và củng cố phát âm toàn bộ 1,500 từ vựng Oxford cốt lõi theo cấp độ và chủ đề.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-pure-white text-xs font-extrabold px-4 py-2.5 rounded-2xl flex items-center gap-1.5 hover:bg-primary/90 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              Thêm từ mới
            </button>
            <div className="bg-secondary/10 text-secondary text-xs font-extrabold px-4 py-2.5 rounded-2xl flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm leading-none">menu_book</span>
              Tổng số: {meta.totalItems} từ
            </div>
          </div>
        </header>

        {/* Search and Filters Section */}
        <section className="bg-pure-white border border-outline-variant/30 rounded-2xl p-5 mb-8 shadow-sm flex flex-col gap-5">
          {/* Row 1: Search & Topic Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Box */}
            <div className="md:col-span-2 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm từ tiếng Anh hoặc nghĩa tiếng Việt..."
                className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {/* Topic Filter Select (dynamic từ API) */}
            <div className="relative">
              <select
                value={topicFilter}
                onChange={(e) => handleTopicChange(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline-variant/40 rounded-xl text-sm font-bold focus:outline-none focus:border-primary appearance-none cursor-pointer"
              >
                <option value="All">Chủ đề: Tất cả</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {TOPIC_TRANSLATIONS[topic] || topic}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                keyboard_arrow_down
              </span>
            </div>
          </div>

          {/* Row 2: Level Tabs */}
          <div>
            <span className="text-xs font-bold text-outline uppercase tracking-wider block mb-2 select-none">
              Trình độ (CEFR)
            </span>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => handleLevelChange(lvl)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    levelFilter === lvl
                      ? "bg-primary text-pure-white shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {lvl === "All" ? "Tất cả" : lvl}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Word Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
            <p className="text-sm text-on-surface-variant mt-4">Đang tải từ vựng...</p>
          </div>
        ) : words.length === 0 ? (
          <div className="text-center max-w-md mx-auto glass-panel rounded-2xl p-8 border border-pure-white/50 shadow-sm mt-12">
            <span className="material-symbols-outlined text-5xl text-outline mb-2">menu_book</span>
            <h3 className="font-bold text-lg">Không tìm thấy từ vựng nào</h3>
            <p className="text-sm text-on-surface-variant mt-2 mb-6">
              Không có từ vựng nào khớp với từ khóa hoặc bộ lọc của bạn.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setLevelFilter("All");
                setTopicFilter("All");
                setCurrentPage(1);
              }}
              className="py-2.5 px-6 bg-primary text-pure-white font-bold rounded-xl text-sm transition-all"
            >
              Xem tất cả từ vựng
            </button>
          </div>
        ) : (
          <>
            {/* Lưới hiển thị từ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
              {words.map((w) => (
                <WordCard
                  key={w.id}
                  word={w}
                  topicLabel={TOPIC_TRANSLATIONS[w.topic] || w.topic}
                  onWordClick={handleWordClick}
                  onSpeakWord={speakWord}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={meta.totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </main>

      {/* Dictionary Detail Modal */}
      {selectedWordId && (
        <WordDetailModal
          detailedWord={detailedWord}
          modalLoading={modalLoading}
          modalLanguage={modalLanguage}
          setModalLanguage={setModalLanguage}
          flashcardAdded={flashcardAdded}
          addingFlashcard={addingFlashcard}
          onClose={handleCloseModal}
          onAddToFlashcards={handleAddToFlashcards}
          onSearchSynonym={handleSearchSynonym}
          onSpeakWord={speakWord}
          onNavigateToSpeaking={handleNavigateToSpeaking}
        />
      )}

      {/* Add Word Modal */}
      {showAddModal && (
        <AddWordModal
          onClose={() => setShowAddModal(false)}
          onWordAdded={() => fetchWords()}
        />
      )}
    </div>
  );
}
