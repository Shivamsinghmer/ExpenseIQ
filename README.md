# 💰 ExpensePal

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-Expo-blue?logo=react)](https://expo.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**ExpensePal** is a premium, AI-powered personal finance management suite. It combines a high-fidelity mobile application for real-time tracking with a modern landing page, all powered by a robust Node.js backend utilizing Google Gemini AI for deep financial insights.

---

## Key Features

### Mobile Experience

- **AI-Powered Chat**: Natural language interaction with your financial data using Google Gemini.
- **Smart Imports**: Automatic data extraction from Transaction SMS and physical receipts.
- **Money Story**: Visual, interactive reports that narrate your financial journey.
- **Advanced Tools**: Built-in EMI trackers, debt managers, and disciplined budget envelope systems.
- **Secure Payments**: Integrated with Razorpay for seamless Pro subscriptions.

### Website Landing Page

- **Modern Aesthetic**: A brand-consistent, premium design with smooth animations.
- **Currency Sync**: Interactive pricing section supporting multiple currencies (INR, USD, EUR, etc.) with real-time flag updates.
- **Responsive Layout**: Optimized for all devices from mobile to desktop.
- **Infrastructure**: Dedicated Privacy and Terms pages with automated routing.

---

## Project Structure

```bash
ExpensePal/
├── mobile/        # React Native (Expo) Application
├── website/       # Next.js 14 Landing Page
├── backend/       # Node.js & Express API Server
└── legal/         # Original legal documentation
```

---

## Quick Start

### Prerequisites

- Node.js 18+ & npm
- Expo CLI (`npx expo`)
- [Clerk](https://clerk.com) account (Auth)
- [Neon](https://neon.tech) PostgreSQL database
- [Google AI](https://aistudio.google.com) API key (Gemini)

---

### 1. Backend Setup

```bash
cd backend
npm install
# Configure .env (DATABASE_URL, CLERK_SECRET_KEY, GEMINI_API_KEY)
npx prisma generate
npx prisma db push
npm run dev
```

### 2. Mobile Setup

```bash
cd mobile
npm install
# Configure .env (EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, EXPO_PUBLIC_API_URL)
npx expo start
```

### 3. Website Setup

```bash
cd website
npm install
npm run dev
```

---

## Tech Stack

| Component    | Technologies                                                         |
| :----------- | :------------------------------------------------------------------- |
| **Mobile**   | Expo, React Native, TypeScript, Clerk, NativeWind, TanStack Query    |
| **Website**  | Next.js 14 (App Router), Tailwind CSS, Lucide React, Framer Motion   |
| **Backend**  | Node.js, Express, Prisma ORM, Neon PostgreSQL, Zod, Google Gemini AI |
| **Payments** | Razorpay SDK Integration                                             |

---

## Security & Privacy

- **Authentication**: Industry-standard JWT verification via Clerk.
- **Data Isolation**: Multi-tenant architecture ensuring complete user data privacy.
- **AI Ethics**: Gemini AI only accesses pre-aggregated, anonymized transaction context.
- **Validation**: Strict input schema validation using Zod.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Crafted with ❤️ by Sandeepan Nandi
</p>
