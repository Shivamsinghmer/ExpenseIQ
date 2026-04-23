"use client";

import React, { useState } from "react";

export default function CTASection() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail("");
  };

  return (
    <section className="py-24" style={{ backgroundColor: "var(--brand-green-soft)" }}>
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
          <span className="text-slate-900">Helpful budgeting </span>
          <span className="text-forest-green">tips</span>
          <br />
          <span className="text-slate-900">directly </span>
          <span className="text-forest-green">in your inbox</span>
        </h2>
        <p className="text-slate-600 text-base mb-10 leading-relaxed">
          Get amazing tips and tricks to help you succeed on your budgeting adventure. No spam, just valuable learning.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address..."
            aria-label="Email address for newsletter"
            className="flex-1 bg-white border border-slate-200 text-slate-800 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green/40 transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="bg-forest-green text-white font-semibold text-sm px-7 py-3.5 rounded-xl hover:opacity-90 active:scale-95 transition-all"
          >
            Submit
          </button>
        </form>

        <p className="text-slate-400 text-xs mt-5">
          By subscribing you accept our{" "}
          <a href="#" className="underline hover:text-slate-600">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
        </p>
      </div>
    </section>
  );
}
