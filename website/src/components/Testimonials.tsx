"use client";

import React from "react";

const reviews = [
  {
    text: "I really like the clean interface and how smoothly everything works. The reminders are super helpful and customizable, which makes it easy to stay organized!",
    source: "App Store Review",
  },
  {
    text: "I'm very happy with the app and its functionalities—definitely the best finance management tool out there. Highly recommend!",
    source: "App Store Review",
  },
  {
    text: "I've been using it for several years. Great app! Easy to use and very convenient. I bought the pro version, it covers my needs. Responsive technical support!",
    source: "Play Store Review",
  },
  {
    text: "I have been using it for years now, highly recommended. You just have to get used to it at first but in its simplicity it has everything you need for budgeting.",
    source: "Play Store Review",
  },
  {
    text: "Excellent application, I have been using it for 5 years already. After purchasing an iPhone, I easily transferred data from Android.",
    source: "App Store Review",
  },
  {
    text: "I've used it for years. Simple and flexible, it's a perfect way to track expenses and record them wherever you're shopping. Love it!",
    source: "Play Store Review",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="mb-12">
          <span className="inline-block text-xs font-bold text-forest-green uppercase tracking-widest px-3 py-1 rounded-full bg-forest-green/10 mb-5">
            Testimonials
          </span>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight">
                Budgeters are raving
              </h2>
              <p className="text-slate-500 mt-3 text-base">
                Real stories, five-star moments, zero marketing fluff.
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
              <div className="flex items-center gap-2 bg-amber-400 text-slate-900 px-4 py-2 rounded-full font-bold text-lg">
                <span>★</span>
                <span>4.7</span>
              </div>
              <span className="text-slate-400 text-sm">+283.000 reviews</span>
            </div>
          </div>
        </div>

        {/* Review grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((review, i) => (
            <article
              key={i}
              className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-amber-400 text-base">★</span>
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{review.text}</p>
              </div>
              <p className="text-slate-400 text-xs mt-5 pt-4 border-t border-slate-100">{review.source}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
