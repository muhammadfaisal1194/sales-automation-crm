# Sales AI CRM

An AI-powered Sales CRM with a Kanban pipeline, lead scoring, email drafting, and Google integrations — built with React, Node.js, Prisma, and Anthropic Claude.

## Features

- **AI Email Drafting** — Claude writes personalized cold outreach emails with subject lines
- **AI Lead Scoring** — Automatically scores leads 0–100 with actionable insights
- **AI Deal Summaries** — Brief deal briefs covering status, risks, and urgency
- **AI Next Action** — Recommends the single best next sales action with a talk track
- **Kanban Pipeline** — Drag-and-drop deal board across Prospecting → Qualified → Proposal → Closing
- **Gmail Integration** — Send emails and read thread history per contact
- **Calendar Integration** — View upcoming meetings and schedule new ones
- **Drive Integration** — Search and link Google Drive files to deals
- **Lead Management** — Sortable table with search, filters, bulk actions, and CSV import
- **Email Templates** — Reusable templates with variable substitution and send-to-lead flow
- **Dark Mode** — Full dark/light mode with persistence

## Prerequisites

- Node.js 18+
- npm 8+

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd sales-automation-crm
npm install
```

### 2. Configure environment

```bash
cp .env.example server/.env
```

Edit `server/.env` and fill in your keys:

```env
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/callback
JWT_SECRET=change_this_to_a_random_string
DATABASE_URL=file:./prisma/dev.db
PORT=3001
```

### 3. Set up the database

```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
cd ..
```

### 4. Seed demo data

```bash
npm run seed
```

This creates:
- Demo user: `demo@salesai.com` / `demo1234`
- 12 realistic leads spread across all pipeline stages
- Pre-scored leads with AI insights
- 3 email templates

### 5. Start development servers

```bash
npm run dev
```

Opens:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Getting API Keys

### Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Navigate to **API Keys**
3. Click **Create Key**
4. Copy the key to `server/.env` as `ANTHROPIC_API_KEY`

### Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable the following APIs:
   - Gmail API
   - Google Calendar API
   - Google Drive API
4. Go to **OAuth consent screen**:
   - User type: External
   - Add scopes: Gmail read/send, Calendar, Drive read-only
   - Add your email as a test user
5. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/api/google/callback`
6. Copy Client ID and Client Secret to `server/.env`
7. In the app, go to **Settings** → click **Connect** next to Gmail

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run build` | Build both frontend and backend for production |
| `npm run seed` | Seed the database with demo data |
| `npm run dev --workspace=server` | Start only the backend |
| `npm run dev --workspace=client` | Start only the frontend |
| `cd server && npx prisma studio` | Open Prisma Studio database browser |
| `cd server && npx prisma migrate dev` | Run new database migrations |

## Project Structure

```
├── client/                    # React + TypeScript frontend
│   └── src/
│       ├── components/        # Layout, AIDrawer, ScoreBadge, Skeletons
│       ├── pages/             # Dashboard, Pipeline, Leads, Outreach, Settings, ...
│       ├── hooks/             # useLeads, useDeals, useAI
│       ├── services/          # api.ts (axios), ai.ts (SSE streaming)
│       └── store/             # Zustand: authStore, leadsStore, uiStore
├── server/
│   ├── src/
│   │   ├── routes/            # auth, leads, deals, ai, google, gmail, calendar, drive, outreach
│   │   ├── ai/                # draftEmail, scoreLeads, summarizeDeal, nextAction
│   │   ├── middleware/        # auth (JWT), errorHandler
│   │   └── index.ts           # Express app entry point
│   └── prisma/
│       ├── schema.prisma      # Database schema
│       └── seed.ts            # Demo data seed script
├── .env.example               # Environment variable template
└── README.md
```

## Screenshots

_Add screenshots here after first run_

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + dark mode |
| State | Zustand |
| Drag-and-drop | @dnd-kit/core |
| Forms | react-hook-form + Zod |
| HTTP | Axios |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite via Prisma ORM |
| AI | Anthropic Claude (claude-sonnet-4-20250514) via SSE streaming |
| Auth | JWT (email + password) |
| Google | Gmail + Calendar + Drive via OAuth2 |
