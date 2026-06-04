# Trackr — Personal Finance Tracker

A full-featured expense tracker built with **Next.js 14**, **PostgreSQL**, and **Prisma**. Tracks income, expenses, lending, borrowing, budgets, goals, recurring transactions, and bill splits.

## Tech stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | Next.js 14 (App Router)             |
| Database    | PostgreSQL + Prisma ORM             |
| Auth        | NextAuth.js v5 (credentials + Google) |
| UI          | Tailwind CSS + shadcn/ui            |
| Charts      | Recharts                            |
| State       | Zustand                             |
| Validation  | Zod                                 |
| Mobile      | React Native / Expo (phase 2)       |

## Design system

**Theme: Slate & Sky**

| Token          | Value      | Usage                    |
|----------------|------------|--------------------------|
| `--ss-blue-500` | `#3A7BD5` | Primary, CTAs, splits    |
| `--ss-income`   | `#2EB87E` | Income amounts           |
| `--ss-expense`  | `#E05A6A` | Expense amounts          |
| `--ss-loan`     | `#7C5CBF` | Lending (you gave)       |
| `--ss-borrow`   | `#F59C3A` | Borrowing (you owe)      |
| `--ss-recurring`| `#5A8FAA` | Recurring items          |

## Getting started

### 1. Clone and install

```bash
git clone <your-repo>
cd trackr
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET, and optionally Google OAuth
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Set up the database

```bash
# Push the schema
npm run db:push

# Or run migrations (recommended for production)
npm run db:migrate

# Seed with demo user + default categories
npm run db:seed
```

### 4. Run the dev server

```bash
npm run dev
# → http://localhost:3000
```

Demo login: `demo@trackr.app` / `password123`

## Project structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup — no sidebar
│   │   ├── login/
│   │   └── signup/
│   ├── (app)/           # Authenticated app — has sidebar
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── analytics/
│   │   ├── budgets/
│   │   ├── loans/
│   │   ├── splits/
│   │   ├── recurring/
│   │   ├── contacts/
│   │   ├── goals/
│   │   └── settings/
│   └── api/             # API routes
├── components/
│   ├── layout/          # Sidebar, Topbar
│   ├── ui/              # Buttons, inputs, modals
│   ├── transactions/
│   ├── loans/
│   ├── budgets/
│   ├── splits/
│   ├── analytics/
│   └── shared/
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── prisma.ts        # Prisma client
│   └── utils.ts         # formatCurrency, formatDate, cn()
├── store/
│   └── app.store.ts     # Zustand global state
└── types/
    └── index.ts         # All TypeScript types
```

## Available scripts

| Script            | Description                            |
|-------------------|----------------------------------------|
| `npm run dev`     | Start dev server (localhost:3000)      |
| `npm run build`   | Production build                       |
| `npm run db:push` | Sync schema to database (no migration) |
| `npm run db:migrate` | Run migrations                      |
| `npm run db:studio` | Open Prisma Studio (DB GUI)         |
| `npm run db:seed` | Seed demo data                         |

## Database schema

```
users
  ├── transactions  (income, expense)
  ├── categories    (per-user, typed)
  ├── budgets       (monthly, per category)
  ├── goals         (savings targets)
  ├── loans         (lent / borrowed)
  │   └── loan_repayments
  ├── splits        (bill splitting)
  │   └── split_members
  ├── recurring_rules
  │   └── transactions (generated)
  └── contacts
```

## Build order (recommended)

1. ✅ Project scaffold (this)
2. → Transactions CRUD + API routes
3. → Dashboard analytics
4. → Budgets & goals
5. → Loans & repayments
6. → Bill splits
7. → Recurring rules + cron job
8. → React Native mobile app
"# trackr" 
