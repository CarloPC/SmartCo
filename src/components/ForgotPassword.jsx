import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const actionCodeSettings = {
      // Your Vercel route
      url: "https://smartco-barangay.vercel.app/reset-password",
      handleCodeInApp: true,
    };


    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setMessage("Password reset link sent! Please check your email (and spam folder).");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Failed to send reset link. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-sm text-white/60">
            Enter your registered email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Alerts */}
        {message && (
          <div className="flex items-start gap-3 p-4 mb-6 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 mb-6 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@smartco.com"
                className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending link...</span>
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}