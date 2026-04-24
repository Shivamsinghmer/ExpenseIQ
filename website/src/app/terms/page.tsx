"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TermsOfService() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#fcfcfc] py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-[#FF6A00] transition-colors mb-12 group"
        >
          <ChevronLeft size={20} className="" />
          <span className="font-semibold">Back to Home</span>
        </button>

        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-slate-400 font-medium tracking-widest uppercase text-xs">Last Updated: 24 April, 2026</p>
        </header>

        <div className="prose prose-slate max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              By accessing or using ExpensePal, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              ExpensePal provides a personal finance management tool including expense tracking, AI-powered insights, and subscription management. We reserve the right to modify or discontinue the service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              When you create an account, you must provide accurate information. You are responsible for maintaining the security of your account and for all activities that occur under the account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Pro Subscriptions & Payments</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              Pro subscriptions are billed on a monthly or annual basis. Payments are processed through Cashfree. All fees are non-refundable unless required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              The Service and its original content, features, and functionality are and will remain the exclusive property of ExpensePal and its licensors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              In no event shall ExpensePal be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Changes to Terms</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              We reserve the right to modify these terms at any time. We will provide notice of any significant changes. Your continued use of the service after such modifications constitutes acceptance of the new terms.
            </p>
          </section>
        </div>

        <footer className="mt-20 pt-8 border-t border-slate-100">
          <p className="text-slate-400 text-sm font-medium">&copy; 2026 ExpensePal. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
