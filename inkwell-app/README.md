# Inkwell

Your shelf of dark things not yet written.

A private book-creation app: a library of all your book projects, and inside each one — character profiles, a visual plot arc, chapter-by-chapter writing space (up to 100 chapters), a chaotic brain-dump page with keyword-based suggestions for where new ideas belong, world/theme notes, and a continuity timeline.

## Setup

See `SETUP_GUIDE.md` for full step-by-step instructions (Supabase database + Netlify hosting, no coding required).

Quick version for developers:

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev
```

Run `supabase_schema.sql` in your Supabase project's SQL Editor before first use.

## Stack

- React + Vite, Tailwind CSS
- Supabase (Postgres) as the database, called directly from the browser
- react-router for navigation
- No backend server required — deploys as a static site

