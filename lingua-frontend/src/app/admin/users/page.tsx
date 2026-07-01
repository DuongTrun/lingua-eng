"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

interface ManageUser {
  id: string;
  email: string;
  name: string;
  role: string;
  currentLevel: string;
  streak: number;
  xp: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, loadUser } = useAuthStore();
  
  const [users, setUsers] = useState<ManageUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // User to delete (triggers confirmation modal)
  const [userToDelete, setUserToDelete] = useState<ManageUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Authenticate and authorize admin
  useEffect(() => {
    const checkAuthAndAdmin = async () => {
      await loadUser();
      const currentUser = useAuthStore.getState().user;
      const authed = useAuthStore.getState().isAuthenticated;

      if (!authed || !currentUser) {
        router.push("/login");
        return;
      }

      if (currentUser.role !== "ADMIN") {
        alert("Bạn không có quyền truy cập trang quản trị này!");
        router.push("/dashboard");
      }
    };
    checkAuthAndAdmin();
  }, [loadUser, router]);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setErrorMsg(err instanceof Error ? err.message : "Không thể tải danh sách người dùng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN" && token) {
      fetchUsers();
    }
  }, [isAuthenticated, user, token]);

  // Handle Role Toggle (USER <-> ADMIN)
  const handleToggleRole = async (targetUser: ManageUser) => {
    const newRole = targetUser.role === "ADMIN" ? "USER" : "ADMIN";
    
    // Prevent self-demotion
    if (targetUser.id === user?.id) {
      setErrorMsg("Bạn không thể tự hạ quyền của chính mình!");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setActionLoading(true);
    try {
      await api.put(`/users/${targetUser.id}/role`, { role: newRole });
      setUsers(
        users.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
      setSuccessMsg(`Đã cập nhật vai trò của ${targetUser.name} thành ${newRole}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi khi cập nhật vai trò!");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle User Deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    // Prevent self-deletion
    if (userToDelete.id === user?.id) {
      setErrorMsg("Bạn không thể tự xóa tài khoản của chính mình!");
      setUserToDelete(null);
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setActionLoading(true);
    try {
      await api.delete(`/users/${userToDelete.id}`);
      setUsers(users.filter((u) => u.id !== userToDelete.id));
      setSuccessMsg(`Đã xóa tài khoản người dùng ${userToDelete.name} thành công.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi khi xóa người dùng!");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setActionLoading(false);
      setUserToDelete(null);
    }
  };

  // Calculations for Admin Stats
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const regularCount = users.filter((u) => u.role === "USER").length;
  const totalXp = users.reduce((sum, u) => sum + (u.xp || 0), 0);

  // Filtered users for live search
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Return spinner if loading auth or if not authorized yet
  if (!isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen text-on-surface flex flex-col md:flex-row relative">
      {/* Decorative background blobs */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-primary-fixed-dim/10 blur-[80px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-secondary-fixed-dim/10 blur-[100px]"></div>
      </div>

      {/* Navigation Sidebar */}
      <Sidebar activeItem="admin-users" />

      {/* Main Content Area */}
      <main className="flex-grow md:pl-[280px] mt-16 md:mt-0 p-6 md:p-margin-page relative z-10 overflow-y-auto max-w-container-max mx-auto w-full">
        {/* Welcome Row */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1 uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
            Hệ thống Quản trị
          </div>
          <h1 className="text-headline-lg text-3xl font-extrabold tracking-tight mb-1">Quản lý Thành viên</h1>
          <p className="text-body-md text-on-surface-variant text-sm">Xem danh sách người dùng, thiết lập vai trò và quản lý tài khoản.</p>
        </header>

        {/* Global Error/Success Notification */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-error-container text-error rounded-xl text-sm flex items-center gap-2 border border-error/20 animate-pulse">
            <span className="material-symbols-outlined text-xl">error</span>
            <p className="font-semibold">{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-secondary-fixed-dim/10 text-secondary-fixed text-green-600 rounded-xl text-sm flex items-center gap-2 border border-green-500/20">
            <span className="material-symbols-outlined text-xl">check_circle</span>
            <p className="font-semibold">{successMsg}</p>
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-unit-lg mb-8">
          {/* Card 1: Total Users */}
          <div className="glass-panel p-5 rounded-2xl border border-pure-white/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Tổng thành viên</span>
              <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">group</span>
            </div>
            <div className="text-3xl font-black text-on-surface mb-1">{loading ? "..." : totalUsers}</div>
            <p className="text-[10px] text-on-surface-variant font-medium">Tài khoản đăng ký trên hệ thống</p>
          </div>

          {/* Card 2: Admins */}
          <div className="glass-panel p-5 rounded-2xl border border-pure-white/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Ban Quản trị</span>
              <span className="material-symbols-outlined text-orange-500 text-2xl group-hover:scale-110 transition-transform">shield_person</span>
            </div>
            <div className="text-3xl font-black text-orange-500 mb-1">{loading ? "..." : adminCount}</div>
            <p className="text-[10px] text-on-surface-variant font-medium">Tài khoản có toàn bộ đặc quyền (ADMIN)</p>
          </div>

          {/* Card 3: Normal Users */}
          <div className="glass-panel p-5 rounded-2xl border border-pure-white/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Học viên thường</span>
              <span className="material-symbols-outlined text-teal-500 text-2xl group-hover:scale-110 transition-transform">school</span>
            </div>
            <div className="text-3xl font-black text-teal-500 mb-1">{loading ? "..." : regularCount}</div>
            <p className="text-[10px] text-on-surface-variant font-medium">Người dùng cơ bản học tập (USER)</p>
          </div>

          {/* Card 4: Accumulated XP */}
          <div className="glass-panel p-5 rounded-2xl border border-pure-white/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Tổng điểm XP</span>
              <span className="material-symbols-outlined text-yellow-500 text-2xl group-hover:scale-110 transition-transform">workspace_premium</span>
            </div>
            <div className="text-3xl font-black text-yellow-500 mb-1">{loading ? "..." : totalXp.toLocaleString()}</div>
            <p className="text-[10px] text-on-surface-variant font-medium">Tổng điểm kinh nghiệm tích lũy</p>
          </div>
        </section>

        {/* User List Panel */}
        <section className="glass-panel rounded-2xl border border-pure-white/60 shadow-sm overflow-hidden mb-12">
          {/* Header Controls */}
          <div className="p-6 border-b border-outline-variant/30 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mr-auto">
              <span className="material-symbols-outlined text-primary">list_alt</span>
              Danh sách thành viên
            </h2>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline text-lg">search</span>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-pure-white border border-outline-variant rounded-xl text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-shadow"
                placeholder="Tìm theo tên hoặc email..."
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors text-on-surface-variant hover:text-primary flex items-center justify-center disabled:opacity-50"
              title="Tải lại danh sách"
            >
              <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto w-full">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
                <p className="text-sm text-on-surface-variant font-medium">Đang tải dữ liệu thành viên...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-20 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
                <p className="font-semibold text-sm">Không tìm thấy thành viên nào phù hợp.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-label-caps font-bold text-xs text-on-surface-variant border-b border-outline-variant/30 select-none">
                    <th className="py-4 px-6">Thành viên</th>
                    <th className="py-4 px-6 text-center">Trình độ</th>
                    <th className="py-4 px-6 text-center">Vai trò</th>
                    <th className="py-4 px-6 text-center">XP</th>
                    <th className="py-4 px-6 text-center">Streak</th>
                    <th className="py-4 px-6">Ngày tham gia</th>
                    <th className="py-4 px-6 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === user?.id;
                    const dateJoined = new Date(u.createdAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });

                    return (
                      <tr key={u.id} className="hover:bg-surface-container-low/40 transition-colors text-sm">
                        {/* Name and Email */}
                        <td className="py-4 px-6 flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-sm uppercase ${
                            u.role === 'ADMIN' ? 'bg-orange-500/10 text-orange-500' : 'bg-primary/10 text-primary'
                          }`}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-on-surface flex items-center gap-1.5">
                              {u.name}
                              {isSelf && (
                                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md uppercase">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-on-surface-variant font-medium">{u.email}</div>
                          </div>
                        </td>

                        {/* English Level */}
                        <td className="py-4 px-6 text-center">
                          <span className="px-2.5 py-1 bg-surface-container-highest text-on-surface font-bold rounded-lg text-xs border border-outline-variant/30">
                            {u.currentLevel}
                          </span>
                        </td>

                        {/* Role */}
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${
                            u.role === 'ADMIN' 
                              ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                              : 'bg-teal-500/10 text-teal-500 border border-teal-500/20'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {u.role}
                          </span>
                        </td>

                        {/* XP */}
                        <td className="py-4 px-6 text-center font-bold text-yellow-600">
                          🏆 {u.xp || 0}
                        </td>

                        {/* Streak */}
                        <td className="py-4 px-6 text-center font-bold text-orange-500">
                          🔥 {u.streak || 0}
                        </td>

                        {/* Date Joined */}
                        <td className="py-4 px-6 text-on-surface-variant font-medium">
                          {dateJoined}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            {/* Toggle Role Button */}
                            <button
                              onClick={() => handleToggleRole(u)}
                              disabled={isSelf || actionLoading}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all border ${
                                u.role === 'ADMIN'
                                  ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20'
                                  : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                              title={isSelf ? "Không thể tự hạ quyền bản thân" : `Chuyển quyền thành ${u.role === 'ADMIN' ? 'USER' : 'ADMIN'}`}
                            >
                              {u.role === 'ADMIN' ? 'Hạ cấp' : 'Thăng cấp'}
                            </button>

                            {/* Delete User Button */}
                            <button
                              onClick={() => setUserToDelete(u)}
                              disabled={isSelf || actionLoading}
                              className="p-1.5 rounded-xl bg-error/10 hover:bg-error/20 text-error border border-error/20 hover:border-error/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              title={isSelf ? "Không thể tự xóa bản thân" : "Xóa tài khoản người dùng"}
                            >
                              <span className="material-symbols-outlined text-lg leading-none">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pure-black/30 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-pure-white/60 p-6 shadow-2xl animate-[scaleUp_0.2s_ease-out]">
            <div className="flex items-center gap-3 text-error mb-4">
              <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-on-surface">Xác nhận xóa tài khoản</h3>
                <p className="text-xs text-on-surface-variant">Thao tác này không thể hoàn tác!</p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của học viên{" "}
              <strong className="text-on-surface font-extrabold">{userToDelete.name}</strong> ({userToDelete.email})? Mọi tiến trình học tập, lịch sử hội thoại và flashcard của học viên này sẽ bị xóa sạch khỏi hệ thống.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 px-4 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold rounded-xl text-sm transition-all border border-outline-variant/30"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="flex-1 py-2.5 px-4 bg-error hover:bg-error-container text-pure-white font-bold rounded-xl text-sm transition-all shadow-md shadow-error/20 active:scale-[0.98]"
              >
                {actionLoading ? "Đang xóa..." : "Xác nhận Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
