# todo-backend

Lambda handler for the todo app API. TypeScript, deployed via CDK `NodejsFunction`.

## Structure

```
todo-backend/
├── src/
│   ├── handler.ts            ← Lambda entry point (routing)
│   ├── todos.repository.ts   ← DynamoDB access layer
│   └── http.ts               ← Response helpers (ok, created, notFound…)
├── tsconfig.json
└── package.json
```

## API

All requests require the `X-User-Id` header. The React app generates a UUID on first visit and stores it in `localStorage`.

| Method | Path            | Body                     | Description              |
|--------|-----------------|--------------------------|--------------------------|
| GET    | /todos          | —                        | List todos for this user |
| POST   | /todos          | `{ title: string }`      | Create a todo            |
| PATCH  | /todos/{todoId} | `{ completed: boolean }` | Toggle complete          |
| DELETE | /todos/{todoId} | —                        | Delete a todo            |

## Local development

```bash
npm install
npm run build      # type-check only (tsc --noEmit)
```

## Environment variables

| Variable     | Description                                          |
|--------------|------------------------------------------------------|
| `TABLE_NAME` | DynamoDB table name (injected by CDK at deploy time) |