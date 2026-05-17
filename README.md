# GoalFlow — Enterprise Goal Tracking Portal 🏆

An AI-Native, enterprise-grade Goal Management SaaS built for high-performance teams. Built with **Next.js 15**, **Tailwind CSS**, **ShadCN UI**, **Framer Motion**, and **Groq AI (LLaMA 3.3)**.

---

## ✨ Features

| Feature | Status |
|---|---|
| 🤖 AI Goal Drafter (Groq LLaMA 3.3) | ✅ Live |
| 📊 AI Performance Insights (Dashboard) | ✅ Live |
| 🎯 Goal Creation with BRD Validation | ✅ Live |
| ✅ Manager Approval Workflow | 🔨 In Progress |
| 📅 Quarterly Check-ins (Q1–Q4) | 🔨 In Progress |
| 📈 Analytics Dashboard (Recharts) | ✅ Live |
| 🌙 Dark / Light Mode | ✅ Live |
| 🔐 OTP Authentication | ✅ Live |
| 🛡️ Role-based Access (Employee / Manager / Admin) | 🔨 In Progress |

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/goal-tracking-portal.git
cd goal-tracking-portal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Copy the example file and fill in your credentials:
```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the values:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

> **Get your Groq API key at:** https://console.groq.com/keys
> **Get your Supabase credentials at:** https://supabase.com/dashboard/project/_/settings/api

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Demo Login
The app uses a mock OTP authentication system for demo purposes:
1. Enter any **email or phone number**
2. Click **Get OTP**
3. Enter **`111111`** as the OTP
4. You're in! ✅

---

## 🔒 Security

> **IMPORTANT:** Never commit your `.env.local` file to GitHub.

- `.env.local` is already added to `.gitignore` — your API keys are safe ✅
- The `GROQ_API_KEY` has **no** `NEXT_PUBLIC_` prefix — it **never** gets exposed to the browser ✅
- All AI calls go through secure **Next.js API Routes** (`/api/ai/...`) on the server ✅
- Use `.env.local.example` as a template for collaborators

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + ShadCN UI
- **Animations**: Framer Motion
- **Charts**: Recharts
- **AI**: Groq SDK (LLaMA 3.3 70B)
- **Auth & DB**: Supabase (PostgreSQL, Auth, RLS)
- **Forms**: React Hook Form + Zod
- **Theme**: next-themes

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/ai/          ← Server-side Groq AI routes (secure)
│   ├── app/             ← Protected app pages (dashboard, goals, etc.)
│   ├── login/           ← Authentication page
│   └── page.tsx         ← Landing page
├── components/
│   ├── ui/              ← ShadCN components
│   ├── sidebar.tsx
│   ├── top-navbar.tsx
│   ├── ai-insights-card.tsx
│   └── login-form.tsx
└── lib/
    └── supabase/        ← Supabase client (browser + server)
```

---

## 🗄️ Database Setup (Supabase)

Run the SQL schema in `supabase/schema.sql` in your Supabase SQL editor to create all required tables.

---

## 📦 Deployment

Deploy to **Vercel** and add environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## 🏆 Built for Enterprise Hackathon
