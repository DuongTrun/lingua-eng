"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function HomePage() {
  const router = useRouter();
  const { loadUser } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      await loadUser();
      // After trying to load user:
      if (useAuthStore.getState().isAuthenticated) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    };
    
    initializeAuth();
  }, [loadUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
      <div className="text-center space-y-4">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>
          sync
        </span>
        <h1 className="text-headline-md font-bold">Lingua Eng</h1>
        <p className="text-body-md text-on-surface-variant">Đang khởi tạo ứng dụng...</p>
      </div>
    </div>
  );
}
