"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppModeStore } from "@/store/useAppModeStore";

interface SidebarProps {
  activeItem: "dashboard" | "flashcards" | "vocabulary" | "exercises" | "conversations" | "shadowing" | "leaderboard" | "settings" | "admin-users" | "word-sorter" | "grammar";
  showMobileHeader?: boolean;
}

export default function Sidebar({ activeItem, showMobileHeader = true }: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isBeautyMode, toggleBeautyMode } = useAppModeStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) return null;

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "dashboard",
      href: "/dashboard",
    },
    {
      id: "flashcards",
      label: "Flashcards",
      icon: "style",
      href: "/flashcards",
    },
    {
      id: "grammar",
      label: "Cấu trúc Ngữ pháp",
      icon: "menu_book",
      href: "/grammar",
    },
    {
      id: "vocabulary",
      label: "Thư viện Từ vựng",
      icon: "library_books",
      href: "/vocabulary",
    },
    {
      id: "exercises",
      label: "AI Exercises",
      icon: "assignment",
      href: "/exercises",
    },
    {
      id: "word-sorter",
      label: "Word Type Sorter",
      icon: "sports_esports",
      href: "/exercises/word-sorter",
    },
    {
      id: "conversations",
      label: "AI Conversations",
      icon: "forum",
      href: "/conversations",
    },
    {
      id: "shadowing",
      label: "Shadowing Practice",
      icon: "record_voice_over",
      href: "/shadowing",
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: "leaderboard",
      href: "#", // To be implemented
    },
    ...(user.role === 'ADMIN' ? [{
      id: "admin-users" as const,
      label: "Quản lý Thành viên",
      icon: "admin_panel_settings",
      href: "/admin/users",
    }] : []),
  ];

  return (
    <>
      {/* 📱 Thanh TopBar trên Mobile (Chỉ hiện khi showMobileHeader = true) */}
      {showMobileHeader && (
        <div className="fixed top-0 left-0 right-0 h-16 bg-surface border-b border-outline-variant/30 flex items-center justify-between px-6 z-30 md:hidden">
          <button
            onClick={() => setIsOpen(true)}
            className="w-10 h-10 rounded-xl hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-all cursor-pointer"
            title="Mở menu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          
          <div className="flex items-center gap-2 text-headline-sm font-extrabold text-primary select-none text-base">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              record_voice_over
            </span>
            Lingua Eng
          </div>

          <div className="flex items-center gap-3">
            {user.streak > 0 && (
              <div className="flex items-center gap-1 text-orange-500 font-bold text-sm select-none">
                🔥 {user.streak}
              </div>
            )}
            <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm select-none">
              🏆 {user.xp}
            </div>
          </div>
        </div>
      )}

      {/* 🌫️ Backdrop phủ mờ màn hình khi mở Sidebar trên Mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden animate-[fadeIn_0.2s_ease-out]"
        ></div>
      )}

      {/* 🚪 Sidebar Menu Panel (Dạng Drawer trên mobile, dạng Sidebar đứng cố định trên desktop) */}
      <aside className={`bg-surface border-r border-outline-variant/30 flex flex-col justify-between p-6 z-50 fixed inset-y-0 left-0 w-72 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:w-sidebar-width md:h-screen md:fixed md:left-0 md:top-0 overflow-y-auto max-h-screen
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="space-y-6 flex-1 flex flex-col justify-start">

          {/* Logo & Close Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-headline-md font-extrabold text-primary select-none text-xl">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                record_voice_over
              </span>
              Lingua Eng
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-all cursor-pointer"
              title="Đóng menu"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* 💅 Beauty Salon Mode Switcher */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 font-bold">content_cut</span>
                <span className="text-sm font-bold text-amber-900">Beauty Salon Mode</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBeautyMode}
                  onChange={toggleBeautyMode}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            <p className="text-xs text-amber-800/80 leading-relaxed">
              Bật chế độ chỉ học từ vựng và hội thoại chuyên ngành **Làm Mi & Tóc**.
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = activeItem === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsOpen(false)} // Tự động đóng menu khi bấm chuyển trang trên mobile
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary font-bold"
                      : "hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface font-semibold"
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="pt-6 border-t border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate">{user.name}</p>
              <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-error/10 hover:bg-error/20 text-error font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}

