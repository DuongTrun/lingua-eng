"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

interface ShadowingPassage {
  id: string;
  title: string;
  referenceText: string;
  vietnameseTranslation: string;
  level: string;
  topic: string;
  duration: string;
  bestScore: number | null;
}

export default function ShadowingListPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, loadUser } = useAuthStore();

  const [passages, setPassages] = useState<ShadowingPassage[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicFilter, setTopicFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");

  // State cho Modal thêm bài mới
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<"auto" | "manual">("auto");
  const [newTitle, setNewTitle] = useState("");
  const [newReferenceText, setNewReferenceText] = useState("");
  const [newVietnameseTranslation, setNewVietnameseTranslation] = useState("");
  const [newLevel, setNewLevel] = useState("B1");
  const [newTopic, setNewTopic] = useState("Daily Life");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const topics = ["All", "Daily Life", "Business", "Travel", "News", "Movies", "Beauty"];
  const levels = ["All", "A2", "B1", "B2", "C1"];

  // Kiểm tra xác thực người dùng
  useEffect(() => {
    const checkAuth = async () => {
      await loadUser();
      if (!useAuthStore.getState().isAuthenticated) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [loadUser, router]);

  // Fetch danh sách bài Shadowing
  const fetchPassagesList = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    setLoading(true);
    try {
      const topicParam = topicFilter !== "All" ? topicFilter : "";
      const levelParam = levelFilter !== "All" ? levelFilter : "";
      
      let url = "/shadowing/passages";
      const params = new URLSearchParams();
      if (topicParam) params.append("topic", topicParam);
      if (levelParam) params.append("level", levelParam);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);
      setPassages(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách bài shadowing:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, topicFilter, levelFilter]);

  useEffect(() => {
    fetchPassagesList();
  }, [fetchPassagesList]);

  // Xử lý thêm bài luyện tập mới
  const handleAddPassage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creationMode === "manual" && (!newTitle.trim() || !newReferenceText.trim() || !newVietnameseTranslation.trim())) {
      setErrorMessage("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }
    setSubmitting(true);
    setErrorMessage("");
    try {
      const payload: Record<string, string> = {
        mode: creationMode,
        level: newLevel,
        topic: newTopic,
      };

      if (creationMode === "manual") {
        payload.title = newTitle;
        payload.referenceText = newReferenceText;
        payload.vietnameseTranslation = newVietnameseTranslation;
      }

      await api.post("/shadowing/passages", payload);

      // Đóng modal & reset form
      setIsAddModalOpen(false);
      setCreationMode("auto");
      setNewTitle("");
      setNewReferenceText("");
      setNewVietnameseTranslation("");
      setNewLevel("B1");
      setNewTopic("Daily Life");

      // Load lại danh sách bài tập
      await fetchPassagesList();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Lỗi khi thêm bài shadowing:", err);
      setErrorMessage(err.response?.data?.message || "Có lỗi xảy ra khi tạo bài luyện tập!");
    } finally {
      setSubmitting(false);
    }
  };

  // Đọc thử câu mẫu (TTS Preview)
  const speakPreview = (e: React.MouseEvent, text: string) => {
    e.stopPropagation(); // Ngăn sự kiện click lan ra card
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
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
      {/* Sidebar navigation */}
      <Sidebar activeItem="shadowing" />

      {/* Main Content Area */}
      <main className="flex-grow md:pl-[280px] mt-16 md:mt-0 p-6 md:p-margin-page relative min-h-screen">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl">record_voice_over</span>
              🎙️ Shadowing Practice
            </h1>
            <p className="text-sm text-on-surface-variant mt-1.5">
              Luyện phát âm chuẩn bản xứ bằng cách nghe câu mẫu và đọc theo để AI chấm điểm chi tiết.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-pure-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm shadow-primary/10 cursor-pointer self-start sm:self-center active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Thêm bài mới
          </button>
        </header>

        {/* Filter Pills */}
        <section className="mb-6 flex flex-col gap-4">
          {/* Topic filter */}
          <div>
            <span className="text-xs font-bold text-outline uppercase tracking-wider block mb-2">Chủ đề</span>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setTopicFilter(topic)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    topicFilter === topic
                      ? "bg-primary text-pure-white shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {topic === "All" ? "Tất cả" : topic}
                </button>
              ))}
            </div>
          </div>

          {/* Level filter */}
          <div>
            <span className="text-xs font-bold text-outline uppercase tracking-wider block mb-2">Cấp độ</span>
            <div className="flex flex-wrap gap-2">
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
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

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
            <p className="text-sm text-on-surface-variant mt-4">Đang tải danh sách bài tập...</p>
          </div>
        ) : passages.length === 0 ? (
          <div className="text-center max-w-md mx-auto glass-panel rounded-2xl p-8 border border-pure-white/50 shadow-sm mt-12">
            <span className="material-symbols-outlined text-5xl text-outline mb-2">record_voice_over</span>
            <h3 className="font-bold text-lg">Không tìm thấy bài đọc</h3>
            <p className="text-sm text-on-surface-variant mt-2 mb-6">
              Không có bài luyện đọc nào phù hợp với bộ lọc đã chọn. Hãy thử thay đổi bộ lọc khác.
            </p>
            <button
              onClick={() => {
                setTopicFilter("All");
                setLevelFilter("All");
              }}
              className="py-2.5 px-6 bg-primary text-pure-white font-bold rounded-xl text-sm transition-all"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-4xl">
            {passages.map((passage) => {
              // Cắt ngắn câu preview nếu dài quá
              const previewText =
                passage.referenceText.length > 70
                  ? passage.referenceText.slice(0, 70) + "..."
                  : passage.referenceText;

              return (
                <div
                  key={passage.id}
                  onClick={() => router.push(`/shadowing/${passage.id}`)}
                  className="glass-panel hover:shadow-md transition-all rounded-2xl p-5 border border-outline-variant/30 flex flex-col md:flex-row items-center gap-4 cursor-pointer hover:border-primary/30"
                >
                  {/* Left: Play circle */}
                  <button
                    onClick={(e) => speakPreview(e, passage.referenceText)}
                    className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all shrink-0 cursor-pointer"
                    title="Nghe giọng đọc mẫu"
                  >
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      play_circle
                    </span>
                  </button>

                  {/* Middle: Content & Info */}
                  <div className="flex-grow text-center md:text-left min-w-0">
                    <h3 className="font-bold text-lg text-on-surface truncate">{passage.title}</h3>
                    <p className="text-sm text-on-surface-variant italic truncate mt-0.5" title={passage.referenceText}>
                      &ldquo;{previewText}&rdquo;
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                      <span className="px-2.5 py-0.5 bg-secondary/10 text-secondary text-[11px] font-bold rounded-full">
                        {passage.topic}
                      </span>
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded-full">
                        Cấp độ {passage.level}
                      </span>
                      <span className="px-2.5 py-0.5 bg-surface-container-high text-on-surface-variant text-[11px] font-semibold rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs leading-none">timer</span>
                        {passage.duration}
                      </span>
                    </div>
                  </div>

                  {/* Right: Score and Action */}
                  <div className="flex items-center gap-4 shrink-0 mt-3 md:mt-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-outline-variant/20">
                    <div>
                      {passage.bestScore !== null ? (
                        <div className="flex flex-col items-center md:items-end">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Điểm cao nhất</span>
                          <span className="text-sm font-extrabold text-secondary flex items-center gap-1 bg-secondary/5 px-2.5 py-1 rounded-lg mt-0.5">
                            🏆 {passage.bestScore}/100
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-outline bg-surface-container-high px-2.5 py-1 rounded-lg">
                          Chưa tập
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => router.push(`/shadowing/${passage.id}`)}
                      className="px-5 py-2.5 bg-primary text-pure-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-sm shadow-primary/10 cursor-pointer"
                    >
                      Luyện tập
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Thêm bài luyện tập mới */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div 
              className="bg-surface border border-outline-variant/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-[fadeIn_0.2s_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>

              <h2 className="text-xl font-extrabold text-on-surface flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                Tạo bài Shadowing mới
              </h2>

              {/* Mode Toggle Switch */}
              <div className="flex bg-surface-container-high p-1 rounded-xl mb-4 border border-outline-variant/10">
                <button
                  type="button"
                  onClick={() => setCreationMode("auto")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    creationMode === "auto"
                      ? "bg-surface text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                  AI Tự động sinh
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode("manual")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    creationMode === "manual"
                      ? "bg-surface text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                  Tự nhập thủ công
                </button>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 bg-error/10 text-error text-xs font-bold rounded-xl border border-error/20">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleAddPassage} className="space-y-4">
                {creationMode === "manual" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                        Tiêu đề (Ví dụ: At the Hotel) <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nhập tiêu đề bài đọc..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary/50 focus:outline-none rounded-xl text-sm transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                        Câu tiếng Anh mẫu <span className="text-error">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Nhập câu tiếng Anh để luyện đọc..."
                        value={newReferenceText}
                        onChange={(e) => setNewReferenceText(e.target.value)}
                        className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary/50 focus:outline-none rounded-xl text-sm transition-all resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                        Bản dịch tiếng Việt <span className="text-error">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Nhập nghĩa tiếng Việt của câu trên..."
                        value={newVietnameseTranslation}
                        onChange={(e) => setNewVietnameseTranslation(e.target.value)}
                        className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary/50 focus:outline-none rounded-xl text-sm transition-all resize-none"
                      />
                    </div>
                  </>
                )}

                {creationMode === "auto" && (
                  <div className="py-2 px-3 bg-primary/5 border border-primary/10 rounded-xl mb-2">
                    <p className="text-xs text-primary leading-relaxed flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-sm mt-0.5">info</span>
                      Hệ thống sẽ sử dụng <strong>Gemini AI</strong> để tự động biên soạn tiêu đề, câu tiếng Anh mẫu chuẩn CEFR và bản dịch nghĩa tiếng Việt phù hợp với cấp độ & chủ đề bạn chọn dưới đây.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                      Cấp độ
                    </label>
                    <select
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary/50 focus:outline-none rounded-xl text-sm transition-all cursor-pointer"
                    >
                      <option value="A1">A1 (Cơ bản)</option>
                      <option value="A2">A2 (Sơ cấp)</option>
                      <option value="B1">B1 (Trung cấp)</option>
                      <option value="B2">B2 (Trung cao cấp)</option>
                      <option value="C1">C1 (Cao cấp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                      Chủ đề
                    </label>
                    <select
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary/50 focus:outline-none rounded-xl text-sm transition-all cursor-pointer"
                    >
                      <option value="Daily Life">Daily Life</option>
                      <option value="Business">Business</option>
                      <option value="Travel">Travel</option>
                      <option value="News">News</option>
                      <option value="Movies">Movies</option>
                      <option value="Beauty">Beauty</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 hover:bg-surface-container-high text-on-surface-variant font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-primary text-pure-white font-bold rounded-xl text-xs hover:bg-primary/95 transition-all shadow-sm shadow-primary/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                        {creationMode === "auto" ? "AI đang soạn bài..." : "Đang lưu..."}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">
                          {creationMode === "auto" ? "smart_toy" : "save"}
                        </span>
                        {creationMode === "auto" ? "AI tạo bài & Lưu" : "Lưu lại"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
