# Tech Stack

## Recommended stack
### Frontend
- Next.js with App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- React Hook Form + Zod

### Backend
- Next.js API routes/server actions for MVP
- Optionally extract backend later to NestJS/FastAPI if scale requires

### Database
Preferred:
- Supabase PostgreSQL
- Prisma ORM or Supabase client
- Supabase Storage for evidence files
- Row Level Security for faculty/admin separation

Alternative:
- Firebase Auth + Firestore + Storage if the team prefers Google-native free-tier simplicity

### Auth
- Supabase Auth or institutional SSO if available
- Role-based access control in database

### AI layer
- Gemini/OpenAI API for evaluator-assist summaries
- Strict JSON output for AI evaluation
- Server-side only; never expose API key to frontend

### Exports
- CSV for Google Sheets
- XLSX for Excel
- Optional Google Sheets API integration later

### Deployment
- Vercel for frontend and server routes
- Supabase managed DB
- Environment variables for secrets

## Why this stack
- Next.js + Tailwind + shadcn/ui gives fast, polished UI.
- Supabase/PostgreSQL is better for structured appraisal data, audit logs, relational exports, and admin reporting.
- Versioned schemas and rubrics are easier in SQL.
- Server-side API routes keep hidden evaluation logic away from faculty browser code.

## Environment variables
```env
NEXT_PUBLIC_APP_NAME=Faculty Performance Appraisal Portal
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
AI_PROVIDER=gemini
GEMINI_API_KEY=
OPENAI_API_KEY=
APP_URL=http://localhost:3000
```

## Package suggestions
```bash
npx create-next-app@latest faculty-appraisal-portal --typescript --tailwind --eslint --app --src-dir
npx shadcn@latest init
npx shadcn@latest add button card input textarea select checkbox dialog alert table badge tabs accordion progress toast dropdown-menu
npm install framer-motion react-hook-form zod @hookform/resolvers date-fns papaparse xlsx
npm install @supabase/supabase-js prisma @prisma/client
```
