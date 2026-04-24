"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

import { Apple, Star } from "lucide-react";



export default function HeroSection() {
  return (
    <section className="wave-bg pt-40 pb-0 overflow-hidden min-h-screen flex items-center relative">
      {/* Background Wavy Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="none">
          <path d="M0,160 C320,300 420,100 640,200 C860,300 960,100 1280,200 L1440,250 L1440,800 L0,800 Z" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-brand-green-soft">
            <animate attributeName="d" dur="20s" repeatCount="indefinite" values="M0,160 C320,300 420,100 640,200 C860,300 960,100 1280,200 L1440,250 L1440,800 L0,800 Z; M0,180 C300,280 400,120 600,220 C800,320 900,120 1200,220 L1440,270 L1440,800 L0,800 Z; M0,160 C320,300 420,100 640,200 C860,300 960,100 1280,200 L1440,250 L1440,800 L0,800 Z" />
          </path>
          <path d="M0,320 C240,400 480,240 720,320 C960,400 1200,240 1440,320" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-brand-green-soft opacity-50" />
          <path d="M0,480 C360,560 720,400 1080,480 C1440,560 1800,400 2160,480" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-brand-green-soft opacity-30" />
          <path d="M-100,250 C200,350 500,150 800,250 C1100,350 1400,150 1700,250" fill="none" stroke="currentColor" strokeWidth="1" className="text-brand-green-soft opacity-40" />
          {/* More Wavy Lines */}
          <path d="M0,100 Q360,200 720,100 T1440,100" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-brand-green opacity-20" />
          <path d="M0,700 Q360,600 720,700 T1440,700" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-brand-green opacity-20" />
          <path d="M200,0 Q400,400 200,800" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-brand-green-soft opacity-20" />
          <path d="M1240,0 Q1040,400 1240,800" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-brand-green-soft opacity-20" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-end relative z-10">
        {/* Left Content */}
        <div className="z-10 animate-fade-in pb-20">
          <div className="flex flex-wrap gap-8 mb-8">
            <div className="flex items-center gap-3">
              <Image src="/wreath.svg" alt="Left" width={32} height={32} className="scale-x-[-1] opacity-60" />
              <div className="text-center">
                <div className="text-sm font-bold text-forest-green">+10,000</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">downloads</div>
              </div>
              <Image src="/wreath.svg" alt="Right" width={32} height={32} className="opacity-60" />
            </div>

            <div className="flex items-center gap-3">
              <Image src="/wreath.svg" alt="Left" width={32} height={32} className="scale-x-[-1] opacity-60" />
              <div className="flex flex-col items-center">
                <div className="text-[12px] text-forest-green text-center font-bold tracking-tight whitespace-pre-line">&quot;The Perfect Budgeting App {`\n`}For Any Situation&quot;</div>
                
              </div>
              <Image src="/wreath.svg" alt="Right" width={32} height={32} className="opacity-60" />
            </div>
          </div>

          <h1 className="text-4xl lg:text-6xl font-semibold text-[#FF6A00] leading-[1] mb-4">
            Take control of your finances
          </h1>

          <p className="text-base text-gray-700 mb-6 leading-relaxed max-w-lg font-medium">
            The smart budgeting app that helps you track expenses, save money, help invest and achieve your financial goals with ease.
          </p>

          <div className="flex items-center mb-6">
            <div className="h-13 w-auto overflow-hidden flex items-center">
              <Link href="https://play.google.com/store/apps/details?id=com.expensepal.app" className="block">
                <Image 
                  src="/playstore.webp" 
                  alt="Download on Google Play" 
                  width={200}
                  height={200} 
                  className="h-48 w-full object-contain"
                />
              </Link>

            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-slate-500 font-medium mb-2">
              Trusted by <span className="text-slate-900">+10.000 users</span> worldwide
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={16} className="fill-[#FF6A00] text-[#FF6A00]" />
                ))}
              </div>
              <div className="text-xs font-bold text-slate-900 underline decoration-[#FF6A00] decoration-2">
                4.5 + 1.000 ratings
              </div>
            </div>
          </div>
        </div>

        {/* Right — Phone Mockup + Coins */}
        <div className="relative flex justify-center lg:justify-end pr-4 mockup-container self-start">
          {/*
           * IMPORTANT: mockup.svg stays in /public — do NOT move it.
           * All floating elements are positioned relative to this container.
           */}
          <div className="relative w-[280px] lg:w-[250px] translate-y-[-40px] lg:translate-x-[-120px]">

            {/* ── Phone ── */}
            <div className="">
              <Image
                src="/mockup.svg"
                alt="ExpensePal app mockup"
                width={600}
                height={600}
                className="w-full h-auto drop-shadow-2xl translate-y-2"
                priority
              />
            </div>

            {/* ── Brand Assets ── */}
            <div className="absolute top-[50%] -left-[130px] w-[200px] h-[200px] coin-transition asset-netflix coin-float-2 z-10">
              <Image src="/netflix.png" alt="Netflix" width={200} height={200} className="w-full h-auto drop-shadow-lg" />
            </div>
            <div className="absolute top-[-16%] -left-[-88px] w-[300px] h-[300px] coin-transition asset-groceries coin-float-3 z-10">
              <Image src="/groceries.png" alt="Groceries" width={300} height={300} className="w-full h-auto drop-shadow-lg" />
            </div>
            <div className="absolute bottom-[-10%] -left-[-160px] w-[300px] h-[300px] coin-transition asset-starbucks coin-float-1 z-10">
              <Image src="/starbucks.png" alt="Starbucks" width={300} height={300} className="w-full h-auto drop-shadow-lg scale-x-[-1]" />
            </div>

            {/* ── Coins ── */}
            
            <div className="absolute top-[18%] -right-[90px] w-[100px] h-[100px] coin-transition coin-2 coin-float-1 z-10">
              <Image src="/coin.png" alt="Coin" width={80} height={80} className="w-full h-auto scale-x-[-1]" />
            </div>
            <div className="absolute bottom-[0%] -right-[40px] w-[100px] h-[100px] coin-transition coin-3 coin-float-3 z-10">
              <Image src="/coin.png" alt="Coin" width={80} height={80} className="w-full h-auto scale-x-[-1]" />
            </div>
            <div className="absolute top-[8%] -left-[82px] w-[100px] h-[100px] coin-transition coin-float-2 z-10"
                 style={{ animationDelay: "2s" }}>
              <Image src="/coin.png" alt="Coin" width={80} height={80} className="w-full h-auto" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
