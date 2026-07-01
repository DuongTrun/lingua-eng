"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isAuthenticated, loading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Clear store errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError("Vui lòng điền đầy đủ email và mật khẩu!");
      return;
    }

    try {
      await login(email, password);
      // Success will trigger redirect in useEffect or router push directly:
      router.push("/dashboard");
    } catch (err) {
      // Errors are handled by store.error and caught here
      const errorMsg = err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!";
      setFormError(errorMsg);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center relative overflow-hidden text-on-surface p-4">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-background to-primary-fixed/20 pointer-events-none"></div>
      
      {/* Animated Floating Letters */}
      <div className="floating-letter select-none" style={{ top: "10%", left: "15%", animationDelay: "0s" }}>A</div>
      <div className="floating-letter select-none" style={{ top: "60%", left: "5%", animationDelay: "2s", fontSize: "10rem" }}>E</div>
      <div className="floating-letter select-none animate-[float_15s_infinite_ease-in-out_alternate]" style={{ top: "20%", right: "10%", animationDelay: "4s", fontSize: "6rem" }}>Vocab</div>
      <div className="floating-letter select-none" style={{ bottom: "10%", right: "20%", animationDelay: "1s", fontSize: "12rem" }}>T</div>
      <div className="floating-letter select-none animate-[float_15s_infinite_ease-in-out_alternate]" style={{ bottom: "30%", left: "30%", animationDelay: "3s", fontSize: "5rem" }}>Speak</div>

      {/* Main Content Container */}
      <main className="relative z-10 w-full max-w-[440px]">
        {/* Glassmorphism Card */}
        <div className="glass-panel rounded-2xl p-8 w-full transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl">
          {/* Logo Section */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              language
            </span>
            <h1 className="text-headline-md font-extrabold text-primary tracking-tight">Lingua Eng</h1>
          </div>

          {/* Header Text */}
          <div className="text-center mb-8">
            <h2 className="text-headline-md text-on-surface mb-1 text-2xl font-bold">Welcome back!</h2>
            <p className="text-body-md text-on-surface-variant text-sm">Login to continue your learning journey</p>
          </div>

          {/* Error alert */}
          {(formError || error) && (
            <div className="mb-4 p-3 bg-error-container text-error rounded-lg text-sm flex items-center gap-2 border border-error/20">
              <span className="material-symbols-outlined text-lg">error</span>
              <p>{formError || error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="sr-only" htmlFor="email">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline">mail</span>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg text-body-md text-on-surface placeholder-outline bg-pure-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow duration-200"
                  placeholder="Email address"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="sr-only" htmlFor="password">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline">lock</span>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-outline-variant rounded-lg text-body-md text-on-surface placeholder-outline bg-pure-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow duration-200"
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-outline hover:text-primary transition-colors focus:outline-none"
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between mt-2 text-sm">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-me"
                  name="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-outline-variant rounded bg-pure-white cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-on-surface-variant cursor-pointer select-none">
                  Remember me
                </label>
              </div>
              <div>
                <a href="#" className="font-medium text-primary hover:text-primary-container transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-body-md font-bold text-pure-white bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 active:scale-[0.98] shadow-md shadow-primary/20 disabled:bg-primary/50 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-pure-white/80 backdrop-blur-sm text-on-surface-variant rounded-full">
                  or continue with
                </span>
              </div>
            </div>
          </div>

          {/* Social Login */}
          <div className="mt-6 flex justify-center w-full">
            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy-client-id"}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    try {
                      await loginWithGoogle(credentialResponse.credential);
                      router.push("/dashboard");
                    } catch (err) {
                      const errorMsg = err instanceof Error ? err.message : "Đăng nhập Google thất bại!";
                      setFormError(errorMsg);
                    }
                  }
                }}
                onError={() => {
                  setFormError("Không thể xác thực với tài khoản Google!");
                }}
                theme="outline"
                size="large"
                width="376"
              />
            </GoogleOAuthProvider>
          </div>

          {/* Registration Link */}
          <div className="mt-8 text-center text-sm">
            <p className="text-on-surface-variant">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-primary hover:text-primary-container transition-colors">
                Register
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
