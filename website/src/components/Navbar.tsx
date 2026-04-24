"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQs", href: "#faq" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        isScrolled ? "bg-white/80 backdrop-blur-md" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Image 
            src="/logo.png" 
            alt="ExpensePal Logo" 
            width={40} 
            height={40}
            className="w-10 h-10 object-contain"
          />
          <span className="text-xl font-bold tracking-tight text-gray-900">
            ExpensePal
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-slate-700 hover:text-slate-900 py-1.5 px-3.5 rounded-full transition-colors hover:bg-black/5"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="hidden lg:block">
          <Link
            href="https://play.google.com/store/apps/details?id=com.expensepal.app"
            className="inline-block bg-[#FF6A00] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#FF6A00]/90 transition-all"
          >
            Get the app
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-slate-900"
          aria-label="Toggle menu"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-slate-100 p-6 lg:hidden">
          <div className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-semibold text-slate-700 hover:text-forest-green transition-colors"
              >
                {link.name}
              </Link>
            ))}
            
          </div>
        </div>
      )}
    </nav>
  );
}
