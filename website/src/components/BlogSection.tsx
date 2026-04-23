"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const posts = [
  {
    title: "How Credit History Length Impacts Credit Scores",
    category: "BUDGETING",
    image: "https://images.pexels.com/photos/7821473/pexels-photo-7821473.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Credit card and finance document",
    href: "#",
  },
  {
    title: "Roth IRA vs. Traditional IRA: Tax Rules Explained",
    category: "BUDGETING",
    image: "https://images.pexels.com/photos/9929281/pexels-photo-9929281.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Savings jar with coins representing IRA savings",
    href: "#",
  },
  {
    title: "What Is Long-Term Disability Insurance?",
    category: "BUDGETING",
    image: "https://images.pexels.com/photos/6694964/pexels-photo-6694964.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Man at desk reviewing financial documents with laptop",
    href: "#",
  },
];

export default function BlogSection() {
  const [active, setActive] = useState(0);

  return (
    <section id="blog" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="mb-10">
          <span className="inline-block text-xs font-bold text-forest-green uppercase tracking-widest px-3 py-1 rounded-full bg-forest-green/10 mb-4">
            Articles &amp; News
          </span>
          <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900">
            Latest financial news
          </h2>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {posts.map((post, i) => (
            <article key={i} className="group cursor-pointer">
              <a href={post.href} aria-label={`Read: ${post.title}`}>
                <div className="rounded-2xl overflow-hidden mb-4 aspect-video relative">
                  <img
                    src={post.image}
                    alt={post.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <span className="text-xs font-bold text-forest-green tracking-widest">
                  {post.category}
                </span>
                <h3 className="mt-1 text-base md:text-lg font-bold text-slate-900 group-hover:text-forest-green transition-colors leading-snug">
                  {post.title}
                </h3>
              </a>
            </article>
          ))}
        </div>

        {/* Carousel nav */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {posts.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setActive(i)}
                className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-slate-900" : "w-2 bg-slate-300"}`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <button
              aria-label="Previous article"
              onClick={() => setActive((a) => (a - 1 + posts.length) % posts.length)}
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              aria-label="Next article"
              onClick={() => setActive((a) => (a + 1) % posts.length)}
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
