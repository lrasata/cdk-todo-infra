# todo-frontend

React frontend for the cdk-todo-infra full-stack todo app. Built with Vite, React 19, and MUI.

## Stack

- **React 19** — UI
- **MUI v7** (`@mui/material`) + Emotion — component library and styling
- **Vite 8** — dev server and bundler
- **TypeScript 5.9**

## Features

- Create, complete, and delete todos
- Filter by all / active / done
- Progress bar and stats (total, active, done, % complete)
- Optimistic updates — toggle and delete reflect immediately, roll back on error
- User identity via `localStorage` UUID (`todo_user_id`) — no login required, todos are scoped per browser

## Project structure

```
src/
  App.tsx              ← main app component, all state + API calls
  theme.ts             ← MUI theme customization
  components/
    TodoRow.tsx        ← styled list row with slide-in animation
    TodoTitle.tsx      ← todo title with strikethrough when completed
    SectionLabel.tsx   ← small uppercase section header
    DeleteBtn.tsx      ← icon button, hidden until row hover
```

## API

All requests go to `VITE_API_URL` (defaults to `/api` for production, where CloudFront routes `/api/*` to API Gateway).

Every request includes:
- `Content-Type: application/json`
- `X-User-Id: <uuid>` — read from `localStorage`, created on first visit

| Method | Path | Description |
|---|---|---|
| GET | /todos | Fetch all todos for this user |
| POST | /todos | Create a todo `{ title }` |
| PATCH | /todos/{todoId} | Toggle completed `{ completed: boolean }` |
| DELETE | /todos/{todoId} | Delete a todo |

## Local development

```bash
npm ci
VITE_API_URL=https://dev.yourdomain.com npm run dev
```

`VITE_API_URL` should point to the deployed API Gateway URL (or the CloudFront subdomain if the backend is deployed). Without it, requests go to `/api` which only works when served through CloudFront.

## Build

```bash
npm run build
```

Output goes to `dist/`. This folder is uploaded to S3 by `FrontendStack` in `cdk-todo-infra` on `cdk deploy`.

## Other scripts

```bash
npm run lint      # ESLint
npm run preview   # Preview the production build locally
```