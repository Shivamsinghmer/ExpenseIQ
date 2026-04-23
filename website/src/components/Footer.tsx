"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

// Custom Twitter (X) Icon
const TwitterIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z" />
  </svg>
);

// Custom LinkedIn Icon
const LinkedinIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

// Custom Discord Icon
const DiscordIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.572.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.947 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-orange-100 border-t border-orange-100 pt-24 pb-10 rounded-t-4xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

          {/* Col 1 — Brand */}
          <div className="md:col-span-4">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Image 
                src="/logo.png" 
                alt="ExpensePal Logo" 
                width={32} 
                height={32} 
                className="w-8 h-8 object-contain"
              />
              <span className="text-2xl font-bold text-gray-900">
                ExpensePal
              </span>
            </Link>
            <p className="text-slate-500 text-base font-medium leading-relaxed mb-8 max-w-[300px]">
              Master your money with AI-powered tracking, smart budgeting, and automated financial insights.
            </p>
            {/* Social icons */}
            <div className="flex gap-4">
              {[
                { name: "Twitter", icon: <TwitterIcon size={20} />, href: "https://x.com/SandeepanNandi" },
                { name: "Discord", icon: <DiscordIcon size={20} />, href: "https://discord.com/invite/Wwwv8QZuWw" },
                { name: "LinkedIn", icon: <LinkedinIcon size={20} />, href: "https://www.linkedin.com/in/sandeepannandi/" }
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:text-[#FF6A00] hover:bg-orange-50 transition-all"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Product */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-normal mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-slate-500 font-medium hover:text-[#FF6A00] transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="text-slate-500 font-medium hover:text-[#FF6A00] transition-colors">Pricing</Link></li>
              <li><Link href="#faq" className="text-slate-500 font-medium hover:text-[#FF6A00] transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Col 3 — Legal */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-normal mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-slate-500 font-medium hover:text-[#FF6A00] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-slate-500 font-medium hover:text-[#FF6A00] transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Col 4 — Get the App */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-normal mb-6">Download the app</h4>
            <div className="flex flex-col gap-4">
               {/* Google Play Badge - Using playstore.webp from Hero */}
               <a href="https://play.google.com/store/apps/details?id=com.expensepal.app" className="flex items-center">
                  <div className="w-40 h-11 relative shrink-0">
                    <Image 
                      src="/playstore.webp" 
                      alt="Get it on Google Play" 
                      fill 
                      className="object-cover object-left" 
                    />
                  </div>
               </a>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-orange-300 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm font-medium">
            © 2026 ExpensePal. Crafted with ❤️ by Sandeepan Nandi.
          </p>
        </div>
      </div>
    </footer>
  );
}
