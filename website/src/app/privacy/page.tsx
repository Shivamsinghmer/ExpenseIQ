"use client";

import React from "react";
import Link from "next/image";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-400 font-medium tracking-widest uppercase text-xs">Last Updated: 24 April, 2026</p>
        </header>

        <div className="prose prose-slate max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              Welcome to ExpensePal. We are committed to protecting your personal information and your right to privacy.
              If you have any questions or concerns about our policy, or our practices with regards to your personal
              information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              We collect information that you provide to us when you register for the app, such as your name, email
              address, and financial transaction data. We also use third-party services like Clerk for authentication
              and Razorpay for payments, which may collect their own data as per their respective privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-600 leading-relaxed font-medium mb-4">
              We use the information we collect or receive:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-slate-600 font-medium">
              <li>To facilitate account creation and logon process.</li>
              <li>To send you administrative information.</li>
              <li>To fulfill and manage your transactions and subscriptions.</li>
              <li>To improve our services and user experience through AI analysis.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Sharing Your Information</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              We only share information with your consent, to comply with laws, to provide you with services, to
              protect your rights, or to fulfill business obligations. This includes third-party providers like Clerk
              (Auth) and Razorpay (Payments).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              We aim to protect your personal information through a system of organizational and technical security
              measures. However, please remember that no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Privacy Rights</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              Depending on your location, you may have rights under applicable data protection laws. These may include
              the right to request access and obtain a copy of your personal information, to request rectification or
              erasure, and to restrict the processing of your personal information.
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
