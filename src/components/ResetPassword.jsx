import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "../config/firebase";
import {
  Lock, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck,
} from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if oobCode is passed directly or embedded inside a resetUrl param
  let oobCode = searchParams.get("oobCode");
  if (!oobCode && searchParams.get("resetUrl")) {
    try {
      const embeddedUrl = new URL(searchParams.get("resetUrl"));
      oobCode = embeddedUrl.searchParams.get("oobCode");
    } catch (e) {
      console.error("Error parsing reset token from URL:", e);
    }
  }

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (!oobCode) {
      setError("Invalid or expired password reset link.");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage("Your password has been reset successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-action-code") {
        setError("This password reset link has expired or has already been used.");
      } else if (err.code === "auth/weak-password") {
        setError("Please choose a stronger password (at least 6 characters).");
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* glass card — matches LoginPage.jsx / HomePage.jsx */
  const card =
    "rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10";
  const inputClass =
    "w-full pl-10 pr-11 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/40 outline-none text-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:border-cyan-300/60 hover:shadow-[0_0_30px_rgba(34,211,238,0.35)] focus:scale-[1.02] focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/70 focus:shadow-[0_0_35px_rgba(34,211,238,0.55)]";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-4">
      {/* Decorative glow blobs — matches app-wide gradient treatment */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg">
            <span className="text-xl font-bold leading-none text-blue-600">S</span>
          </div>
          <div>
            <div className="text-xl font-bold text-white">SmartCo</div>
            <div className="text-xs text-blue-200">Barangay Management System</div>
          </div>
        </div>

        <div className={`${card} p-8`}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15">
              <ShieldCheck className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Create New Password</h2>
              <p className="text-sm text-white/50 mt-0.5">
                Choose a new password for your account
              </p>
            </div>
          </div>

          {message && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3.5 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">
                New Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 transition-all duration-300 group-focus-within:text-cyan-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={inputClass}
                  disabled={loading || !!message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-white/35">At least 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">
                Confirm New Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 transition-all duration-300 group-focus-within:text-cyan-300" />
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`${inputClass} ${
                    passwordsMismatch
                      ? "!border-red-400/60 focus:!ring-red-400/50"
                      : passwordsMatch
                      ? "!border-emerald-400/60 focus:!ring-emerald-400/50"
                      : ""
                  }`}
                  disabled={loading || !!message}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordsMatch && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                </p>
              )}
              {passwordsMismatch && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !!message}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:from-cyan-500 hover:to-blue-600 hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Password...</span>
                </>
              ) : (
                <span>Save New Password</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}