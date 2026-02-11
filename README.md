# 💰 ExpenseIQ

A cross-platform mobile application for tracking expenses and income with an AI financial assistant powered by Google Gemini.

## 📁 Project Structure

```
ExpenseIQ/
├── mobile/        # Expo (React Native) app
└── backend/       # Node.js API server
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm
- Expo CLI (`npx expo`)
- Android Studio / Xcode (for mobile development)
- [Clerk](https://clerk.com) account
- [Neon](https://neon.tech) PostgreSQL database
- [Google AI](https://aistudio.google.com) API key

### Backend Setup

1. Navigate to the backend:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```
   DATABASE_URL="your-neon-postgres-url"
   CLERK_SECRET_KEY="sk_test_xxxxx"
   GEMINI_API_KEY="your-gemini-api-key"
   PORT=3001
   ```

4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

5. Push database schema:
   ```bash
   npx prisma db push
   ```

6. Start the dev server:
   ```bash
   npm run dev
   ```

### Mobile Setup

1. Navigate to the mobile app:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
   EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
   ```

4. Start Expo:
   ```bash
   npx expo start
   ```

## 🔧 Tech Stack

### Mobile
- Expo (React Native) + TypeScript
- Expo Router (file-based routing)
- NativeWind (Tailwind CSS for RN)
- Clerk Expo SDK (authentication)
- TanStack Query (server state)
- Expo SecureStore (token storage)

### Backend
- Node.js + Express.js + TypeScript
- Prisma ORM + Neon PostgreSQL
- Clerk JWT verification
- Google Gemini API
- Zod validation
- Rate limiting

## 🤖 AI Features

The AI chatbot analyzes your financial data using Google Gemini:
- **Never invents data** - only uses your actual transactions
- **Intent parsing** - understands time periods, categories, and transaction types
- **Structured context** - sends pre-aggregated data to Gemini for accurate responses
- **Rate limited** - 20 requests per minute per user

## 🔐 Security
- Clerk JWT verification on every protected route
- Complete user data isolation via clerkUserId
- Input validation with Zod
- No secrets stored in the mobile app
- Rate limiting on AI endpoints
