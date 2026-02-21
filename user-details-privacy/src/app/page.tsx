"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Trash2, ShieldCheck, Mail, Info, Lock, Eye, EyeOff } from "lucide-react";

export default function AppPrivacyPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address associated with your account.");
      setIsSubmitting(false);
      return;
    }

    if (!password || password.length < 6) {
      setError("Please enter a valid password for your account.");
      setIsSubmitting(false);
      return;
    }

    // Make an API call to the backend
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const apiUrl = `${baseUrl.replace(/\/+$/, "")}/api/users/delete-account`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password, reason })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit deletion request. Please check your credentials.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (err) {
      console.error("Deletion request failed:", err);
      setError("A network error occurred. Please ensure the backend server is running.");
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
          <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Request Submitted</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            We have received your account deletion request. You will receive a confirmation email shortly. Your data will be permanently removed from our systems within 14 days.
          </p>
          <button
            onClick={() => {
              setIsSuccess(false);
              setEmail("");
              setReason("");
            }}
            className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium rounded-xl transition-colors"
          >
            Return to form
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center">

      {/* Header section */}
      <div className="w-full max-w-2xl text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-full mb-4">
          <ShieldCheck size={32} strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-3">
          Manage Your Privacy
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          We value your privacy. Use this portal to request the deletion of your ExpenseIQ account and all associated personal data.
        </p>
      </div>

      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Important Info Panel */}
        <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Info size={18} className="text-blue-500" /> What you should know
            </h3>
            <ul className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex gap-3">
                <div className="mt-0.5 text-zinc-400 dark:text-zinc-500"><AlertTriangle size={16} /></div>
                <span><strong>Irreversible Action:</strong> Once your data is deleted, it cannot be recovered.</span>
              </li>
              <li className="flex gap-3">
                <div className="mt-0.5 text-zinc-400 dark:text-zinc-500"><Trash2 size={16} /></div>
                <span><strong>Data Removed:</strong> All transaction history, preferences, and personal details will be erased.</span>
              </li>
            </ul>
          </div>
          <div className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl text-xs text-zinc-500 font-medium">
            Subject to our Privacy Policy and local regulations (e.g., GDPR, CCPA).
          </div>
        </div>

        {/* Deletion Form */}
        <div className="md:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-xl relative">

          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">
            Account Deletion Request
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Registered Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-zinc-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500 outline-none transition-all placeholder:text-zinc-400"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Account Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-zinc-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500 outline-none transition-all placeholder:text-zinc-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Reason for leaving (Optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Let us know how we could have done better..."
                rows={4}
                className="block w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500 outline-none transition-all placeholder:text-zinc-400 resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl flex items-start gap-2">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-500/30 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'}`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Request Deletion
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </main>
  );
}
