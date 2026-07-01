"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle, isAuthenticated, loading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [level, setLevel] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState({ text: "", color: "bg-surface-container-high", width: "w-0", textColor: "text-on-surface-variant" });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Clear store errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Calculate password strength
  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength({ text: "", color: "bg-surface-container-high", width: "w-0", textColor: "text-on-surface-variant" });
    } else if (password.length < 6) {
      setPasswordStrength({ text: "Weak", color: "bg-error-rose", width: "w-1/3", textColor: "text-error-rose" });
    } else if (password.length < 10 || !/\d/.test(password)) {
      setPasswordStrength({ text: "Medium", color: "bg-tertiary-fixed-dim", width: "w-2/3", textColor: "text-tertiary-container" });
    } else {
      setPasswordStrength({ text: "Strong", color: "bg-secondary-fixed-dim", width: "w-full", textColor: "text-secondary" });
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName || !email || !password || !confirmPassword || !level) {
      setFormError("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (password.length < 6) {
      setFormError("Mật khẩu phải chứa ít nhất 6 ký tự!");
      return;
    }

    if (!agreeTerms) {
      setFormError("Bạn phải đồng ý với Điều khoản dịch vụ và Chính sách bảo mật!");
      return;
    }

    try {
      await register(fullName, email, password, level);
      // Registration successful, redirect to login
      alert("Đăng ký tài khoản thành công! Hãy đăng nhập để tiếp tục.");
      router.push("/login");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Đăng ký thất bại. Email có thể đã tồn tại!";
      setFormError(errorMsg);
    }
  };

  return (
    <div className="bg-background min-h-screen flex flex-col font-body-md text-on-surface relative overflow-x-hidden">
      {/* TopNavBar (Logged Out Context) */}
      <nav className="fixed top-0 w-full z-50 bg-surface shadow-md border-b border-outline-variant/20">
        <div className="flex justify-between items-center px-margin-page py-4 max-w-container-max mx-auto w-full">
          <div className="flex items-center gap-2 text-headline-md font-extrabold text-primary select-none">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              record_voice_over
            </span>
            Lingua Eng
          </div>
          <div className="hidden md:flex gap-8">
            <a className="text-label-caps font-semibold text-on-surface-variant hover:text-primary transition-all hover:scale-105" href="#">Features</a>
            <a className="text-label-caps font-semibold text-on-surface-variant hover:text-primary transition-all hover:scale-105" href="#">Pricing</a>
            <a className="text-label-caps font-semibold text-on-surface-variant hover:text-primary transition-all hover:scale-105" href="#">About</a>
          </div>
          <div className="flex items-center gap-4">
            <Link className="text-label-caps font-semibold text-on-surface-variant hover:text-primary transition-colors" href="/login">Login</Link>
            <Link className="text-label-caps font-semibold text-pure-white bg-primary px-4 py-2 rounded-lg hover:bg-primary-container transition-colors shadow-sm" href="/register">Register</Link>
          </div>
        </div>
      </nav>

      {/* Floating Background Elements */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Abstract gradient blobs */}
        <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-primary-fixed-dim/20 blur-[80px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-secondary-fixed-dim/20 blur-[100px]"></div>
        
        {/* Floating Letters */}
        <div className="absolute top-[20%] left-[15%] text-6xl font-display-hero text-primary/10 animate-[float_8s_infinite_ease-in-out] select-none">A</div>
        <div className="absolute top-[60%] left-[10%] text-8xl font-display-hero text-secondary/5 animate-[float_12s_infinite_ease-in-out] select-none">E</div>
        <div className="absolute top-[30%] right-[20%] text-5xl font-display-hero text-primary-container/10 animate-[float_10s_infinite_ease-in-out_2s] select-none">T</div>
        <div className="absolute bottom-[20%] right-[15%] text-7xl font-display-hero text-tertiary/5 animate-[float_8s_infinite_ease-in-out] select-none">S</div>
        <div className="absolute top-[70%] right-[30%] text-4xl font-display-hero text-primary/10 animate-[float_12s_infinite_ease-in-out] select-none">Speak</div>
        <div className="absolute top-[15%] right-[40%] text-3xl font-display-hero text-secondary/10 animate-[float_10s_infinite_ease-in-out_2s] select-none">Learn</div>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 pt-28 pb-12 relative z-10 w-full">
        {/* Registration Card */}
        <div className="w-full max-w-[440px] glass-panel rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-pure-white/60 p-8 transform transition-transform hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)] duration-300">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                person_add
              </span>
            </div>
            <h1 className="text-headline-md text-2xl font-bold text-on-surface mb-1">Create your account</h1>
            <p className="text-body-md text-on-surface-variant text-sm">Start your English learning journey today</p>
          </div>

          {/* Form Error alert */}
          {(formError || error) && (
            <div className="mb-4 p-3 bg-error-container text-error rounded-lg text-sm flex items-center gap-2 border border-error/20">
              <span className="material-symbols-outlined text-lg">error</span>
              <p>{formError || error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-label-caps font-semibold text-xs text-on-surface-variant mb-1" htmlFor="fullName">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-lg">badge</span>
                </span>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-pure-white border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-label-caps font-semibold text-xs text-on-surface-variant mb-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-lg">mail</span>
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-pure-white border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-label-caps font-semibold text-xs text-on-surface-variant mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative mb-2">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-lg">lock</span>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-pure-white border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div className={`h-full ${passwordStrength.color} ${passwordStrength.width} transition-all duration-300`}></div>
                  </div>
                  <span className={`text-[10px] font-bold ${passwordStrength.textColor} w-12 text-right`}>
                    {passwordStrength.text}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-label-caps font-semibold text-xs text-on-surface-variant mb-1" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-lg">lock_reset</span>
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-pure-white border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showConfirmPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            {/* English Level Dropdown */}
            <div>
              <label className="block text-label-caps font-semibold text-xs text-on-surface-variant mb-1" htmlFor="level">
                Your current English level
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-lg">school</span>
                </span>
                <select
                  id="level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-pure-white border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer text-sm"
                  required
                >
                  <option value="" disabled>Select your level</option>
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper Intermediate</option>
                  <option value="C1">C1 - Advanced</option>
                  <option value="C2">C2 - Proficient</option>
                </select>
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-lg">expand_more</span>
                </span>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 text-primary bg-pure-white border-outline-variant rounded focus:ring-primary focus:ring-2 cursor-pointer"
                  required
                />
              </div>
              <label className="text-[13px] text-on-surface-variant leading-tight cursor-pointer" htmlFor="terms">
                I agree to the <a className="text-primary hover:underline font-medium" href="#">Terms of Service</a> and <a className="text-primary hover:underline font-medium" href="#">Privacy Policy</a>
              </label>
            </div>

            {/* Primary Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-pure-white text-body-md font-bold rounded-xl hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all shadow-md active:scale-[0.98] mt-2 disabled:bg-primary/50 disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-5">
            <div className="flex-grow border-t border-outline-variant/50"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-semibold text-on-surface-variant uppercase">
              or sign up with
            </span>
            <div className="flex-grow border-t border-outline-variant/50"></div>
          </div>

          {/* Google OAuth */}
          <div className="flex justify-center w-full">
            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy-client-id"}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    try {
                      await loginWithGoogle(credentialResponse.credential);
                      router.push("/dashboard");
                    } catch (err) {
                      const errorMsg = err instanceof Error ? err.message : "Đăng ký Google thất bại!";
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

          {/* Bottom Link */}
          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link className="text-primary font-bold hover:underline hover:text-primary-container transition-colors" href="/login">
              Login
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-highest border-t border-outline-variant flex flex-col md:flex-row justify-between items-center px-margin-page py-6 gap-4 z-10 relative">
        <div className="text-primary font-extrabold flex items-center gap-2 select-none text-lg">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            record_voice_over
          </span>
          Lingua Eng
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold uppercase text-on-surface-variant">
          <a className="hover:text-primary underline transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-primary underline transition-colors" href="#">Terms of Service</a>
          <a className="hover:text-primary underline transition-colors" href="#">Contact Support</a>
          <a className="hover:text-primary underline transition-colors" href="#">Sitemap</a>
        </div>
        <div className="text-sm text-on-surface-variant">
          © 2026 Lingua Eng AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
