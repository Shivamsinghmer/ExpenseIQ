"use client";

import React, { useState } from "react";
import { Check, ChevronDown, Sparkles, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_PRICES = {
  monthly: {
    INR: { symbol: "₹", price: 150, label: "India", flag: "🇮🇳" },
    USD: { symbol: "$", price: 2.00, label: "USA", flag: "🇺🇸" },
    EUR: { symbol: "€", price: 1.80, label: "Europe", flag: "🇪🇺" },
    GBP: { symbol: "£", price: 1.60, label: "UK", flag: "🇬🇧" },
    JPY: { symbol: "¥", price: 280, label: "Japan", flag: "🇯🇵" },
    AED: { symbol: "AED", price: 6.99, label: "UAE", flag: "🇦🇪" }
  },
  annual: {
    INR: { symbol: "₹", price: 1530, label: "India", flag: "🇮🇳" },
    USD: { symbol: "$", price: 18.00, label: "USA", flag: "🇺🇸" },
    EUR: { symbol: "€", price: 16.00, label: "Europe", flag: "🇪🇺" },
    GBP: { symbol: "£", price: 15.00, label: "UK", flag: "🇬🇧" },
    JPY: { symbol: "¥", price: 2700, label: "Japan", flag: "🇯🇵" },
    AED: { symbol: "AED", price: 61.99, label: "UAE", flag: "🇦🇪" }
  }
};

const features = [
  "Ask Money AI Chat",
  "Interactive Money Story",
  "EMI & Debt Tracker",
  "Smart Budget Envelopes",
  "Advanced PDF Exports",
  "Priority 24/7 Support",
  "SMS Auto-Import",
  "Unlimited AI Scanning"
];

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [currency, setCurrency] = useState<keyof typeof PLAN_PRICES.monthly>("INR");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentPlan = PLAN_PRICES[billingCycle][currency];

  return (
    <section id="pricing" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-[#FF6A00] uppercase tracking-normal mb-3 text-center">Pricing</h2>
          <h3 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6">Simple, transparent pricing</h3>
          <p className="text-slate-600 font-medium max-w-xl mx-auto text-base">
            Choose the plan that's right for your financial journey. Upgrade to Pro and unlock the full power of AI.
          </p>

          {/* Controls Container */}
          <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-6">
            {/* Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-full w-fit">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-semibold transition-all",
                  billingCycle === "monthly" ? "bg-white text-gray-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2",
                  billingCycle === "annual" ? "bg-[#FF6A00] text-white" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Annual
                <span className="ml-2 text-[10px]">Save 15%</span>
              </button>
            </div>

            {/* Currency Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold hover:border-[#FF6A00]/30 transition-all min-w-[120px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <span>{currentPlan.flag}</span>
                  <span>{currency}</span>
                </div>
                <ChevronDown size={14} className={cn("transition-transform", isDropdownOpen && "rotate-180")} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full mt-1 p-1 rounded-2xl left-0 w-full bg-white border border-slate-100 shadow-sm z-50 overflow-hidden py-1">
                  {Object.keys(PLAN_PRICES.monthly).map((curr) => {
                    const c = curr as keyof typeof PLAN_PRICES.monthly;
                    const data = PLAN_PRICES.monthly[c];
                    return (
                      <button
                        key={c}
                        onClick={() => {
                          setCurrency(c);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-1.5 rounded-full hover:bg-orange-50 text-left text-sm font-medium transition-colors"
                      >
                        <span>{data.flag}</span>
                        <span className="flex-1">{c}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            
            {/* Free Plan */}
            <div className="bg-gray-50 rounded-2xl p-8 flex flex-col border border-slate-100 h-full">
              <div className="mb-8">
                <h4 className="text-xl font-bold text-gray-900 mb-1">Basic</h4>
                <p className="text-slate-500 text-sm font-medium">Perfect for starters tracking small goals.</p>
              </div>
              
              <div className="mb-10">
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-gray-900">Free</span>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                {features.slice(0, 4).map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center">
                       <Check size={12} className="text-orange-600" />
                    </div>
                    <span className="text-slate-600 text-sm font-medium">{f}</span>
                  </div>
                ))}
                {features.slice(4).map((f) => (
                  <div key={f} className="flex items-center gap-3 opacity-30">
                    <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center">
                       <Check size={12} className="text-slate-600" />
                    </div>
                    <span className="text-slate-600 text-sm font-medium">{f}</span>
                  </div>
                ))}
              </div>

              
            </div>

            {/* Pro Plan */}
            <div className="bg-orange-100 rounded-2xl p-8 flex flex-col border-1 border-[#FF6A00] h-full relative">
               <div className="absolute top-0 right-10 -translate-y-1/2 bg-[#FF6A00] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center">
                  Recommended
               </div>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                   <h4 className="text-xl font-bold text-gray-900">Pro</h4>
                </div>
                <p className="text-slate-500 text-sm font-medium">Advanced tools for serious wealth building.</p>
              </div>
              
              <div className="mb-10">
                <div className="flex items-baseline gap-1">
                    <span className="text-gray-900 text-xl font-bold mr-1">{currentPlan.symbol}</span>
                    <span className="text-6xl font-black text-gray-900 leading-none">{currentPlan.price}</span>
                    <span className="text-slate-400 text-lg font-medium">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center">
                       <Check size={12} className="text-orange-600" />
                    </div>
                    <span className="text-gray-900 text-sm font-medium">{f}</span>
                  </div>
                ))}
              </div>

              
            </div>

          </div>
        </div>
      </div>

      {/* Background Decor */}
    </section>
  );
}
