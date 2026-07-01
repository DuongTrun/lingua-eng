"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

interface DashboardStats {
  learnedWordsCount: number;
  dueWordsCount: number;
  totalExercisesCount: number;
  totalConversationsCount: number;
  todayXpEarned: number;
  dailyGoalXp: number;
  isGoalCompleted: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, loadUser } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Initialize and check auth
  useEffect(() => {
    const checkAuth = async () => {
      await loadUser();
      if (!useAuthStore.getState().isAuthenticated) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [loadUser, router]);

  // Fetch Dashboard Stats if authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      const fetchStats = async () => {
        try {
          const response = await api.get("/users/dashboard");
          setStats(response.data);
        } catch (error) {
          console.error("Failed to fetch dashboard stats:", error);
        } finally {
          setLoadingStats(false);
        }
      };
      fetchStats();
    }
  }, [isAuthenticated, token]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
      </div>
    );
  }

  // Calculate percentage of daily goal achieved
  const progressPercent = stats 
    ? Math.min(100, Math.round((stats.todayXpEarned / stats.dailyGoalXp) * 100))
    : 0;

  return (
    <div className="bg-background min-h-screen text-on-surface flex flex-col md:flex-row relative">
      {/* Decorative background blobs */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-primary-fixed-dim/10 blur-[80px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-secondary-fixed-dim/10 blur-[100px]"></div>
      </div>

      {/* Reusable Navigation Sidebar */}
      <Sidebar activeItem="dashboard" />

      {/* Main Content Area */}
      <main className="flex-grow md:pl-[280px] mt-16 md:mt-0 p-6 md:p-margin-page relative z-10 overflow-y-auto max-w-container-max mx-auto w-full">
        {/* Welcome Row */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-headline-lg text-3xl font-extrabold tracking-tight mb-1">Hello, {user.name}!</h1>
            <p className="text-body-md text-on-surface-variant text-sm">Welcome back to your English workout. Let&apos;s achieve your goals today!</p>
          </div>
          
          {/* Quick Stats Widget */}
          <div className="flex gap-4">
            <div className="glass-panel px-4 py-2.5 rounded-xl flex items-center gap-2.5 border border-pure-white/50 shadow-sm">
              <span className="text-orange-500 text-2xl font-bold flex items-center gap-1 select-none animate-[pulse_2s_infinite]">
                🔥 {user.streak}
              </span>
              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider leading-none">
                Days<br/>Streak
              </div>
            </div>
            <div className="glass-panel px-4 py-2.5 rounded-xl flex items-center gap-2.5 border border-pure-white/50 shadow-sm">
              <span className="text-yellow-500 text-2xl font-bold flex items-center gap-1 select-none">
                🏆 {user.xp}
              </span>
              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider leading-none">
                Total<br/>XP
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-unit-lg">
          {/* Left / Center Content: Daily Goal + Main Cards */}
          <div className="lg:col-span-2 space-y-unit-lg">
            
            {/* Daily Goal Card */}
            <div className="glass-panel rounded-2xl p-6 border border-pure-white/50 shadow-sm relative overflow-hidden">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">emoji_events</span>
                Mục tiêu hàng ngày
              </h2>
              
              {loadingStats ? (
                <div className="h-20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary animate-spin">sync</span>
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-end text-sm">
                    <span className="text-on-surface-variant font-medium">Hôm nay: {stats.todayXpEarned} / {stats.dailyGoalXp} XP</span>
                    <span className="font-bold text-primary">{progressPercent}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${stats.isGoalCompleted ? 'bg-secondary-fixed-dim glow-green' : 'bg-primary'}`} 
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-xs text-on-surface-variant">
                    {stats.isGoalCompleted 
                      ? "🎉 Chúc mừng! Bạn đã hoàn thành mục tiêu hàng ngày." 
                      : `Cần thêm ${Math.max(0, stats.dailyGoalXp - stats.todayXpEarned)} XP để hoàn thành mục tiêu hôm nay.`}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">Không thể tải mục tiêu hàng ngày.</p>
              )}
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-lg">
              {/* Flashcards Access */}
              <div className="glass-panel rounded-2xl p-6 border border-pure-white/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
                </div>
                <h3 className="font-bold text-base mb-1">Thư viện Flashcards</h3>
                <p className="text-xs text-on-surface-variant mb-4">Học từ vựng thông minh SRS chuẩn theo thuật toán SM-2.</p>
                {stats && (
                  <div className="flex justify-between text-xs font-semibold text-on-surface-variant pt-2 border-t border-outline-variant/10">
                    <span>Đã thuộc: {stats.learnedWordsCount} từ</span>
                    <span className="text-primary font-bold">Cần ôn: {stats.dueWordsCount} từ</span>
                  </div>
                )}
              </div>

              {/* Speech Conversation Access */}
              <div className="glass-panel rounded-2xl p-6 border border-pure-white/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl">forum</span>
                </div>
                <h3 className="font-bold text-base mb-1">Luyện hội thoại với AI</h3>
                <p className="text-xs text-on-surface-variant mb-4">Nói chuyện trực tiếp với AI Partner theo các tình huống thực tế.</p>
                {stats && (
                  <div className="flex justify-between text-xs font-semibold text-on-surface-variant pt-2 border-t border-outline-variant/10">
                    <span>Đã tham gia: {stats.totalConversationsCount} phiên</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Sidebar: Skill Profiles + Recent Activity */}
          <div className="space-y-unit-lg">
            
            {/* User Level Profile */}
            <div className="glass-panel rounded-2xl p-6 border border-pure-white/50 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">school</span>
                Thông tin học tập
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm py-1.5 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant">Trình độ hiện tại:</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-lg text-xs">
                    {user.currentLevel}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm py-1.5 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant">Mục tiêu ngày:</span>
                  <span className="font-bold text-on-surface">{user.dailyGoalXp} XP</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1.5">
                  <span className="text-on-surface-variant">Bài tập đã làm:</span>
                  <span className="font-bold text-on-surface">
                    {stats ? stats.totalExercisesCount : "..."}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Practice Tips */}
            <div className="glass-panel rounded-2xl p-6 border border-pure-white/50 bg-primary/5 shadow-sm text-sm">
              <h3 className="font-bold mb-2 text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined">lightbulb</span>
                Mẹo học hôm nay
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Đều đặn mỗi ngày luyện phát âm **Shadowing** ít nhất 5 phút sẽ giúp cơ miệng quen với ngữ điệu tiếng Anh, nâng cao độ lưu loát đáng kể!
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
