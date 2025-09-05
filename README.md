# memeGen Client (React + TypeScript + Vite)

A Solana meme image generator and editor with wallet integration, responsive UI, and PWA install prompt for mobile.

## Features
- Create: AI meme image generation with adjustable params
- Edit: AI-powered image modification with style presets and shared Loading indicator
- History: Browse and re-edit generated images (mobile “Edit” action simplified)
- Launch: Start token creation flow from an image
- Responsive UI: Mobile-first tweaks (Create page width constraints, ModelSelector 1-col mobile/3-col desktop, Edit page mobile action buttons always visible)
- PWA: Mobile “Install to Home Screen” banner when not installed

## Tech Stack
- React 19 + TypeScript + Vite 7
- Tailwind CSS 4
- React Router
- Solana Wallet Adapter (Phantom)
- Supabase SDK
- Axios

## Requirements
- Node.js 18+
- npm (or your preferred package manager)

## Setup
1) Install dependencies
```
npm install
```

2) Configure environment variables
Create a `.env` file at project root using `.env.example` as reference:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

3) Run development server
```
npm run dev
```
By default Vite will choose a free port (e.g. 5173/5176/5180). If the port is in use, specify one: `npm run dev -- --port 5180`.

4) Build for production
```
npm run build
```

5) Preview production build
```
npm run preview
```

## PWA Install Prompt (Mobile)
- We ship a web app manifest at `public/manifest.webmanifest` and a mobile-only install banner.
- When the browser fires `beforeinstallprompt` and the app isn’t installed (display-mode not standalone), a dismissible banner appears suggesting installation.
- iOS standalone detection uses `navigator.standalone`.

## Mobile UX Notes
- Create page: containers use `max-w-[92%]` on mobile and `sm:max-w-4xl` on desktop for balanced margins
- ModelSelector: `grid-cols-1` on mobile, `sm:grid-cols-3` on desktop
- Edit page image preview actions: on mobile, “Create token” and “View” are always visible; on desktop, they show on hover
- Shared Loading component used in Edit and MemeGenerationForm for consistent feedback

## Troubleshooting
- Port already in use: run with another port, e.g. `npm run dev -- --port 5180`
- Missing env vars: ensure `.env` is created from `.env.example`
