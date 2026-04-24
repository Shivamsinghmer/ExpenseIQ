"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Star, ArrowRight, TrendingUp, Wallet, Bell, RefreshCw } from "lucide-react";

const testimonials = [
  {
    rating: 5,
    text: "The best app for keeping track of finances. I've been using it for a few months.",
    author: "Ayperi, Play Store"
  },
  {
    rating: 4,
    text: "Great experience so far! The AI categorizing is surprisingly accurate. Highly recommended.",
    author: "Sarah, Play Store"
  },
  {
    rating: 4.5,
    text: "Finally a finance app that doesn't feel like a chore. The SMS import changed my life.",
    author: "Michael, Play Store"
  }
];

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-1 mb-6">
      {[1, 2, 3, 4, 5].map((i) => {
        const isFull = i <= Math.floor(rating);
        const isHalf = !isFull && i <= Math.ceil(rating) && rating % 1 !== 0;
        
        return (
          <div key={i} className="relative">
            <Star 
              size={20} 
              className={`${isFull ? "fill-yellow-400 text-yellow-400" : "text-yellow-400/30"}`} 
            />
            {isHalf && (
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star size={20} className="fill-yellow-400 text-yellow-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function AppPreview() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        setIsVisible(true);
      }, 500);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-[#fcfcfc] py-20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[250px] lg:auto-rows-[300px]">
          
          {/* Card 1: Everything you need (Large, Left) */}
          <div className="md:col-span-4 md:row-span-2 bg-orange-50 rounded-2xl border border-orange-100 p-10 pb-0 flex flex-col justify-between shadow-xs relative group overflow-hidden">
            <div className="z-10 relative">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-2">
                Everything you need to control your finances
              </h2>
              <p className="text-slate-500 text-base font-medium mt-2">Simple, Smart & Secure</p>
            </div>

            {/* Asset: everything.png */}
            <div className="relative mt-0 h-full w-full flex justify-center items-start">
              <div className="relative w-full aspect-[3/5] translate-y-[10%]">
                <Image 
                  src="/everything.png" 
                  alt="Everything dashboard" 
                  fill
                  className="object-cover object-top"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Video Player (Middle) */}
          <div className="md:col-span-4 md:row-span-2 bg-orange-50 rounded-2xl border border-orange-100 p-0 flex flex-col justify-between shadow-xs relative group overflow-hidden">
            <video 
              src="/expense.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover"
            />           
          </div>

          {/* Card 3: Transaction Mockup (Large Right) */}
          <div className="md:col-span-4 md:row-span-2 rounded-2xl p-10 pb-0 overflow-hidden relative shadow-xs group border border-orange-100">
            {/* Dark Green Gradient Overlay */}
            <div className="absolute inset-0 bg-orange-50" />
            
            <div className="z-10 relative h-full flex flex-col">
              <div className="mb-0">
                <h3 className="text-gray-900 text-3xl font-bold mb-2">Daily Transactions</h3>
                <p className="text-slate-500 font-medium text-base">Track every penny automatically</p>
              </div>

              {/* Asset: transaction.png */}
              <div className="relative flex-1 mt-0 w-full flex justify-center items-start">
                <div className="relative w-full aspect-[3/5] translate-y-[10%]">
                  <Image 
                    src="/transaction.png" 
                    alt="Transaction list" 
                    fill
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>


          {/* Card 5: Quote Card (Medium Bottom-Left) - AUTO SLIDING CAROUSEL */}
          <div className="md:col-span-5 md:row-span-1 rounded-2xl p-10 flex flex-col justify-center relative overflow-hidden shadow-xs border border-orange-100 bg-[#FF6A00]">
            <div className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <StarRating rating={testimonials[currentIndex].rating} />
              <p className="text-white text-xl md:text-2xl font-bold leading-tight mb-6">
                "{testimonials[currentIndex].text}"
              </p>
              <div className="text-[#eaf5ef] font-semibold">— {testimonials[currentIndex].author}</div>
            </div>
            
            {/* Pagination / Dots */}
            <div className="absolute right-10 bottom-10 flex gap-2">
              {testimonials.map((_, i) => (
                <div 
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-white scale-110 shadow-sm' : 'bg-white/20 hover:bg-white/40 cursor-pointer'}`}
                  onClick={() => setCurrentIndex(i)}
                />
              ))}
            </div>
          </div>

          {/* Card 6: New Feature card (Medium Bottom-Right) */}
          <div className="md:col-span-7 md:row-span-1 bg-orange-50 rounded-2xl p-10 flex justify-between shadow-xs relative group overflow-hidden cursor-default border border-orange-100">
            <div className="max-w-[280px] z-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Smart Budgeting Insights</h3>
              <p className="text-slate-500 text-base leading-relaxed font-medium">
                Unlock deeper financial clarity with automated tracking and personalized wealth-building suggestions.
              </p>
            </div>

            {/* In-card Visual Mockup */}
            <div className="absolute right-[-20px] bottom-[-20px] w-72 h-72 bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#FF6A00]/10 rounded-2xl flex items-center justify-center text-[#FF6A00] shadow-sm">
                    <TrendingUp size={24} />
                  </div>
                  <div className="h-4 w-32 bg-slate-50 rounded-2xl" />
               </div>
               <div className="space-y-3 opacity-50">
                  <div className="h-2 w-full bg-slate-50 rounded-2xl" />
                  <div className="h-2 w-4/5 bg-slate-50 rounded-2xl" />
               </div>
               <div className="w-full flex-1 bg-slate-50 rounded-xl relative overflow-hidden p-4 flex items-end">
                  <div className="w-full h-full bg-gradient-to-t from-[#FF6A00]/5 to-transparent flex gap-1 items-end">
                    {[40, 70, 45, 90, 60, 80].map((h, i) => (
                      <div key={i} className="flex-1 bg-[#FF6A00]/20 rounded-t-md" style={{ height: `${h}%` }} />
                    ))}
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
