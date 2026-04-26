# Daily Task Tracker

A personal mobile-first web app to track your daily repeating tasks — built with Next.js 14, Tailwind CSS, and Supabase.

## Features

- **Today** — Mark tasks complete/incomplete with one tap. See daily progress at a glance.
- **Tasks** — Add, edit, delete, reorder, and activate/deactivate tasks.
- **History** — Browse the last 30 days. Click any date to see per-task status.
- **Stats** — This week %, this month %, current streak, and best streak.

---

## Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account
- (Optional) A [Vercel](https://vercel.com) account for deployment

---

## 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New project**, choose a name and a strong database password.
3. Wait for the project to finish provisioning (~1 min).
4. In the left sidebar go to **SQL Editor**.
5. Paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.

---

## 2 — Get Your Supabase Credentials

In the Supabase dashboard:

1. Go to **Project Settings → API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 3 — Run Locally

```bash
# 1. Clone / enter the project directory
cd task-app

# 2. Install dependencies
npm install

# 3. Create your .env.local file
cp .env.local.example .env.local

# 4. Paste your Supabase credentials into .env.local
#    NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/today`.

---

## 4 — Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts. When asked for environment variables, add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |

### Option B — Vercel Dashboard

1. Push your code to a GitHub / GitLab / Bitbucket repo.
2. Go to [https://vercel.com/new](https://vercel.com/new) and import the repo.
3. In the **Environment Variables** section add the two variables above.
4. Click **Deploy**.

---

## Project Structure

```
task-app/
├── app/
│   ├── layout.tsx          # Root layout + BottomNav
│   ├── page.tsx            # Redirects → /today
│   ├── today/page.tsx      # Daily task marking
│   ├── tasks/page.tsx      # Task CRUD + reorder
│   ├── history/
│   │   ├── page.tsx        # 30-day summary list
│   │   └── [date]/page.tsx # Per-day task detail
│   └── stats/page.tsx      # Streak + % stats
├── components/
│   ├── BottomNav.tsx
│   ├── TaskCard.tsx
│   ├── ProgressCard.tsx
│   ├── TaskForm.tsx        # Add / edit bottom sheet
│   └── Toast.tsx
├── lib/
│   ├── supabaseClient.ts
│   ├── dateUtils.ts        # Local-date helpers (no UTC issues)
│   └── taskService.ts      # All Supabase queries
├── types/task.ts
├── supabase/schema.sql
└── .env.local.example
```

---

## Database Schema

### `tasks`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `title` | text | required |
| `description` | text | optional |
| `once_date` | date | optional; set for date-specific tasks |
| `is_active` | boolean | default `true` |
| `position` | integer | controls sort order |
| `created_at` | timestamptz | auto |
| `updated_at` | timestamptz | updated on save |

### `task_completions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `task_id` | uuid | FK → tasks(id) cascade delete |
| `completion_date` | date | local date (YYYY-MM-DD) |
| `is_completed` | boolean | toggled by user |
| `created_at` | timestamptz | auto |
| `updated_at` | timestamptz | auto |
| — | unique | `(task_id, completion_date)` |

---

## Key Design Decisions

- **No UTC date bugs** — all dates are derived from the browser's local timezone via `getLocalDateString()`, never from UTC.
- **Upsert pattern** — toggling a task does `upsert` on `(task_id, completion_date)` so you can freely change status throughout the day.
- **Daily repeat** — recurring tasks appear every day; date-specific tasks use `tasks.once_date`.
- **Simple account isolation** — username/PIN sessions are resolved through RPC functions, and task queries are filtered by the signed-in account.
