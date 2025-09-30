# PearlAI API

A Node.js/TypeScript REST API for image segmentation projects with layered architecture, optional JWT auth, robust validation, and Postman collections.

## Quick start

1) Requirements
- Node 18+
- MongoDB (Atlas or local)

2) Install
```bash
npm install
```

3) Configure env
Create a `.env` at project root (see `.env.example`):
```
PORT=3000
MONGODB_URI=<your mongodb uri>
LOG_LEVEL=info
JWT_SECRET=<replace-with-a-long-random-secret>
AUTH_REQUIRED=false
```
- `AUTH_REQUIRED=false` keeps backward-compatible behavior (no auth required).
- Set `AUTH_REQUIRED=true` to require Bearer JWT on write endpoints.

4) Run
```bash
npm run dev    # development
npm run build  # compile to dist/
npm start      # run compiled code
```

## API surface
Base URL: `http://localhost:${PORT}/api`

- Health
  - `GET /health` → service + DB status

- Auth (optional; enabled regardless of `AUTH_REQUIRED`; enforcement governed by it)
  - `POST /auth/signup` → `{ user, token }`
  - `POST /auth/login` → `{ user, token }`

- Projects
  - `POST /projects` → create project
  - `GET /projects/:id` → fetch project
  - `GET /projects/:id/stats` → { images, annotations, perAnnotator[] }
  - `POST /projects/:projectId/images` → bulk add images

- Images
  - `GET /images/:id`

- Annotations
  - `POST /annotations` → create annotation (polygon or RLE)
  - `GET /annotations/:id`
  - `GET /annotations` → filter by label, image, createdBy, project; pagination
  - `GET /annotations/:id/rank` → rank by area within the same image

## Authentication
- Optional JWT Bearer tokens (HS256).
- Toggle enforcement with `AUTH_REQUIRED`.
- When a valid JWT is present, `req.user` is populated and `createdBy` defaults to the caller in `POST /annotations` if omitted.
- Header: `Authorization: Bearer <token>`

## Validation & errors
- Request validation via Zod and custom validators for segmentation payloads.
- Standard error shape:
```json
{ "error": { "message": "...", "details": { /* optional */ } } }
```

## Logging
- Pino + pino-http
  - Concise request logs: `METHOD URL STATUS`
  - Levels: 2xx/3xx → info, 4xx → warn, 5xx → error
  - `GET /api/health` is ignored to reduce noise
- Global level via `LOG_LEVEL` (e.g., `info`, `warn`, `error`).

## Postman collections
- Full coverage: `.postman/PearlAI.API.Full.postman_collection.json`
  - Variables: `baseUrl`, `token`, `email`, `password`, `projectId`, `imageId`, `annotationId`
  - Run order:
    1. Auth → `POST /auth/signup` (or Login) to set `{{token}}`
    2. Projects → `POST /projects` → bulk images
    3. Annotations → create (polygon/RLE), negatives, query, rank

## Data model
- See `MODEL.md` for detailed schemas, relations, and examples.

## Scripts
- `npm run dev` → dev server with ts-node-dev
- `npm run build` → compile TypeScript to `dist/`
- `npm start` → start compiled server

## Project layout
```
src/
  app.ts, index.ts
  config/ (env, db)
  controllers/
  services/
  repositories/
  models/ (User, Project, Image, Annotation)
  middleware/ (auth, errorHandler, validate)
  utils/ (area, pagination)
  routes/ (index, projects, images, annotations, auth, health)
.postman/
ARCHITECTURE.md
MODEL.md
```

## Notes
- Segmentation area computed in `src/utils/area.ts` for polygon and RLE.
- Indexes ensure fast rank queries and filters.
- Error handling centralized in `src/middleware/errorHandler.ts`.
