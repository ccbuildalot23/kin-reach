# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kin-Reach is a React-based web application built with Vite, TypeScript, and shadcn/ui components. It provides a support network and crisis management platform where users can connect with their support contacts during times of need. The app features SMS integration, notification systems, and a mobile-friendly interface with Capacitor support.

## Key Technologies

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Styling**: Tailwind CSS with custom animations
- **Database**: Supabase (PostgreSQL with auth and edge functions)
- **Mobile**: Capacitor for iOS/Android builds
- **State Management**: React hooks + Tanstack Query
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v6

## Common Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

## Architecture Overview

### Directory Structure
- `/src/components/` - Reusable React components
  - `/ui/` - shadcn/ui base components (Button, Dialog, etc.)
  - `/notifications/` - Notification-related components
  - `/settings/` - Settings page components
- `/src/pages/` - Route-level page components
- `/src/hooks/` - Custom React hooks (auth, notifications, etc.)
- `/src/integrations/supabase/` - Supabase client and types
- `/src/lib/` - Utility functions and services
- `/supabase/` - Database migrations and edge functions
  - `/functions/` - Supabase edge functions
  - `/migrations/` - SQL migration files

### Key Components & Pages

1. **Index.tsx** - Main dashboard with support request functionality
2. **Auth.tsx** - Authentication page
3. **CrisisAlert.tsx** - Emergency crisis management interface
4. **Settings.tsx** - User settings and support network management
5. **SMSTesting.tsx** - SMS integration testing interface

### Database Schema (Supabase)

Key tables include:
- `profiles` - User profiles
- `support_network` - User's support contacts
- `notifications` - Notification queue
- `crisis_alerts` - Crisis alert records
- `support_requests` - Support request history

### Authentication Flow

The app uses Supabase Auth with:
- Email/password authentication
- Protected routes via `useAuth` hook
- Session persistence in localStorage
- Auto-redirect to `/auth` for unauthenticated users

### Notification System

- Real-time notifications via Supabase
- Support for SMS notifications (via edge functions)
- In-app notification bell with preferences
- Crisis alerts with priority handling

## Important Configuration

- **Path Aliases**: `@/` maps to `./src/` directory
- **TypeScript**: Relaxed strictness settings (no implicit any, no unused params checks disabled)
- **ESLint**: Configured with React hooks and refresh plugins
- **Vite Dev Server**: Runs on port 8080 with IPv6 support
- **Lovable Integration**: Uses lovable-tagger for development tagging

## Mobile Development

The project includes Capacitor configuration for mobile builds:
- App ID: `app.lovable.240268aa03a24d48b0727f4df844f39c`
- Supports both iOS and Android platforms
- Web assets built to `dist/` directory

## Edge Functions

Located in `/supabase/functions/`:
- `send-support-message` - Handles SMS/notification dispatch

## Development Tips

1. The app uses localStorage for client-side data persistence
2. All Supabase types are auto-generated in `/src/integrations/supabase/types.ts`
3. Use the `@/` import alias for cleaner imports
4. Component styling uses Tailwind utilities with shadcn/ui's `cn()` helper
5. Dark mode is supported throughout the app
6. The app is optimized for mobile-first experiences