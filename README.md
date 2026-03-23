# cdk-todo-infra

Full-stack todo app infrastructure built with CDK Pipelines.
Three repos, one self-mutating pipeline, three environments.

## Repo structure

```
cdk-todo-infra/     ← this repo — CDK pipeline + stacks
todo-backend/       ← Lambda handlers (TypeScript)
todo-frontend/      ← React app (Vite)
```

## Architecture

```
todo-frontend (React)
      │  VITE_API_URL
      ▼
API Gateway  ──▶  Lambda (NodejsFunction)  ──▶  DynamoDB
                                                (PK: userId, SK: todoId)

CloudFront  ──▶  S3 (private, OAC)
WAF (WebACL)
ACM Certificate (us-east-1)
Route53 (A + AAAA alias)
```

## CDK concepts covered

| Concept | File | What it does |
|---|---|---|
| `CodePipeline` (self-mutating) | `pipeline-stack.ts` | Deploys itself before deploying the app |
| `ShellStep` | `pipeline-stack.ts` | Runs npm ci + cdk synth in CodeBuild |
| `ManualApprovalStep` | `pipeline-stack.ts` | Pauses pipeline before prod |
| `Stage` | `todo-app-stage.ts` | Groups all stacks per environment |
| `grantReadWriteData` | `api-stack.ts` | IAM grant — replaces policy + attachment |
| `NodejsFunction` | `api-stack.ts` | Auto-bundles TypeScript with esbuild |
| `Aspects` | `tagging-aspect.ts` | Policy-as-code: tags every resource |
| L3 Construct | `secure-bucket.ts` | Reusable S3 pattern |
| Cross-region refs | `todo-app-stage.ts` | Cert/WAF (us-east-1) → CloudFront |

## Pipeline flow

```
push to main (cdk-todo-infra)
        │
        ▼
Self-mutate  ← pipeline updates itself first
        │
        ▼
Dev    → deploy + smoke test  (automatic)
        │
        ▼
Staging → deploy + smoke test  (automatic)
        │
        ▼
Manual approval gate  ← review in AWS Console
        │
        ▼
Prod   → deploy
```

## One-time setup

### 1. Bootstrap CDK (both regions, all accounts)
```bash
npx cdk bootstrap aws://YOUR_ACCOUNT/eu-central-1
npx cdk bootstrap aws://YOUR_ACCOUNT/us-east-1
```

### 2. Create a CodeStar connection to GitHub
In the AWS Console → CodePipeline → Settings → Connections → Create connection.
Select GitHub, authorize, copy the ARN.

### 3. Set environment variables
```bash
export CDK_ACCOUNT=123456789012
export DOMAIN_NAME=yourdomain.com
export CODESTAR_CONNECTION_ARN=arn:aws:codestar-connections:...
export INFRA_REPO=lrasata/cdk-todo-infra
```

### 4. Deploy the pipeline (one time only)
```bash
npm ci
npx cdk deploy PipelineStack
```

After this, every push to `main` triggers the pipeline automatically.
You never run `cdk deploy` manually again.

## Local development

### Backend
```bash
cd todo-backend
npm ci
# Use SAM or test the handler directly with a mock event
```

### Frontend
```bash
cd todo-frontend
npm ci
VITE_API_URL=https://your-api-url.execute-api.eu-central-1.amazonaws.com/dev npm run dev
```

## Data model

DynamoDB single table: `todos-{stage}`

```
PK: userId   (UUID from browser localStorage — identifies the device)
SK: todoId   (UUID generated at creation)

Attributes:
  title      string
  completed  boolean
  createdAt  ISO string
  updatedAt  ISO string (set on PATCH)
```

Query pattern: `PK = userId` → returns all todos for this browser, newest first.

## API

All requests require the `X-User-Id` header (set automatically by the React app).

| Method | Path | Description |
|---|---|---|
| GET | /todos | List todos for this user |
| POST | /todos | Create a todo `{ title }` |
| PATCH | /todos/{todoId} | Toggle `{ completed: true/false }` |
| DELETE | /todos/{todoId} | Delete a todo |

## Environments

| Stage | Domain | Removal policy | Deploy |
|---|---|---|---|
| dev | dev.yourdomain.com | DESTROY | Auto on push |
| staging | staging.yourdomain.com | DESTROY | Auto after dev |
| prod | yourdomain.com | RETAIN | After manual approval |
