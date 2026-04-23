"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "What is ExpensePal and how does it work?",
    answer:
      "ExpensePal is an AI-powered personal finance app that automatically tracks your expenses, categorizes transactions, and gives you actionable insights to help you save more and spend smarter.",
  },
  {
    question: "Is ExpensePal safe to use with my financial data?",
    answer:
      "Absolutely. We use bank-grade 256-bit encryption to protect your data at rest and in transit. Your financial information is never sold or shared with third parties.",
  },
  {
    question: "Can I sync ExpensePal across multiple devices?",
    answer:
      "Yes! ExpensePal syncs seamlessly across all your devices — iOS, Android, and web — so your data is always up to date wherever you are.",
  },
  {
    question: "Does ExpensePal connect to my bank automatically?",
    answer:
      "ExpensePal supports automatic bank statement imports and SMS-based expense detection. Direct bank integration for major banks is available in the Pro plan.",
  },
  {
    question: "Is ExpensePal free? What's included in the paid version?",
    answer:
      "ExpensePal has a fully-featured free plan. The Pro version adds unlimited AI insights, advanced reports, direct bank sync, and multi-device priority support.",
  },
  {
    question: "Which currencies and languages does ExpensePal support?",
    answer:
      "ExpensePal supports 150+ currencies with real-time exchange rates, and is available in 30+ languages to serve users worldwide.",
  },
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 bg-[#fcfcfc]">
      <div className="max-w-4xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center mb-3 rounded-full text-[#FF6A00] text-sm font-bold uppercase tracking-wider">
             Common Questions
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-tight">
            Still have questions?<br />We've got answers.
          </h2>
          <p className="text-slate-600 font-medium max-w-xl mx-auto text-base">
            Everything you need to know about ExpensePal. Can't find what you're looking for? Reach out to our support team.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={cn(
                "group rounded-2xl transition-all duration-300",
                openIndex === index 
                  ? "" 
                  : ""
              )}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-2 text-left outline-none"
              >
                <span className={cn(
                  "text-lg font-semibold transition-colors",
                  openIndex === index ? "text-gray-900" : "text-slate-700 group-hover:text-gray-900"
                )}>
                  {faq.question}
                </span>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                  openIndex === index ? "bg-[#FF6A00] text-white rotate-180" : "bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-[#FF6A00]"
                )}>
                  <ChevronDown size={18} />
                </div>
              </button>
              
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  openIndex === index ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="px-2 pb-8">
                  <div className="h-px w-full bg-slate-50 mb-2" />
                  <p className="text-slate-500 font-medium leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        
      </div>
    </section>
  );
}
