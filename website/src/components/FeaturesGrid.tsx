"use client";

import React from "react";
import Image from "next/image";
import { 
  Plus, 
  MessageSquare, 
  Camera, 
  UploadCloud, 
  BarChart3, 
  BrainCircuit, 
  CreditCard, 
  Layers 
} from "lucide-react";

const features = [
  {
    id: "quick-add",
    title: "Quick Add with AI",
    description: "Speed-dial your spending. Type naturally and let AI handle the heavy lifting.",
    bgColor: "bg-orange-50",
    image: "/quickadd.png"
  },
  {
    id: "sms-import",
    title: "SMS Import",
    description: "Automatic bank sync. Instantly extract data from transaction SMS.",
    bgColor: "bg-orange-50",
    image: "/sms.png" 
  },
  {
    id: "receipt-scanner",
    title: "Receipt Scanner",
    description: "Bill to budget in one tap. AI scanning that understands every detail.",
    bgColor: "bg-orange-50",
    image: "/receipt.png"
  },
  {
    id: "bank-import",
    title: "Statement Import",
    description: "Your history, simplified. Batch process transactions with smart categorization.",
    bgColor: "bg-orange-50",
    image: "/bank.png"
  },
  {
    id: "analytics",
    title: "Smart Analytics",
    description: "Financial clarity at a glance. Visual insights tailored to your habits.",
    bgColor: "bg-orange-50",
    image: "/analytics.png"
  },
  {
    id: "ai-chat",
    title: "AI Chat",
    description: "Chat with your money. Real-time answers to your toughest finance questions.",
    bgColor: "bg-orange-50",
    image: "/ai.png"
  },
  {
    id: "emi-tracker",
    title: "EMI Tracker",
    description: "Master your commitments. Track loans and EMIs with deadline precision.",
    bgColor: "bg-orange-50",
    image: "/emi.png"
  },
  {
    id: "envelope",
    title: "Budgeting",
    description: "Budget with intention. Modernizing the classic system of total control.",
    bgColor: "bg-orange-50",
    image: "/envelope.png"
  }
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-[#FF6A00] uppercase tracking-normal mb-3">Our Features</h2>
          <h3 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6">Your complete financial control system</h3>
          <p className="text-slate-600 font-medium max-w-2xl mx-auto text-base">
            ExpensePal combines traditional budgeting with cutting-edge AI to give you the most powerful finance tool on the market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`${feature.bgColor} rounded-2xl p-8 pb-0 flex flex-col min-h-[480px] overflow-hidden relative border border-orange-100 shadow-xs transition-shadow`}
            >
              <div className="z-10 relative mb-8">
                <h4 className="text-2xl font-bold mb-3 text-gray-900 leading-tight">{feature.title}</h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Asset: Actual PNG */}
              <div className="relative flex-1 w-full flex items-start justify-center pointer-events-none mt-auto">
                <div className="relative w-full aspect-[3/5] translate-y-[0%]">
                  <Image 
                    src={feature.image} 
                    alt={feature.title}
                    fill
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
