# Ledger Tasks

A task manager set like newsprint — built on the Broadsheet design system
(Source Serif 4 on paper white, cyan and magenta process accents, the page
title printed as its misregistered CMYK plates).

## Run it

```sh
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a production build in `dist/`.

## Features

- **Views** — Today (with overdue), Upcoming (grouped Tomorrow / This Week / Later), All Tasks, Completed
- **Tasks** — title, description, notes, list, priority, due date and time; add, edit, complete/uncomplete, delete with an Undo toast
- **Lists** — create, rename, delete (deleting a list keeps its tasks, unassigned)
- **Search, filters, sorting** — live search across title/description/notes/list; priority and list filters; sort by due date, priority, newest, or A–Z
- **Login** — sign up / sign in with email and password (PBKDF2-hashed, stored client-side); each account gets its own task store
- **Keyboard** — `N` new task, `/` focus search, `Esc` closes any layer
- **Persistence** — everything is stored in `localStorage` behind a small data layer (`src/lib/storage.ts`) that can be swapped for a real backend

## Structure

```
src/
  broadsheet.css      design-system tokens and component classes (source of truth for the look)
  app.css             app-layer styles on top of the tokens
  types.ts            Task / TaskList / View types
  lib/storage.ts      persistence (localStorage today, API tomorrow)
  lib/auth.ts         client-side accounts (swap for Supabase/Clerk for real auth)
  lib/dates.ts        date formatting helpers
  App.tsx             app shell, state, and view logic
  components/         Sidebar, TaskItem, TaskModal, FilterBar, ProgressBar,
                      EmptyState, ConfirmDialog, UndoToast, PlateHeading
```
