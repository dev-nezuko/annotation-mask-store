# Perle AI Segmentation Backend (Node + TypeScript + MongoDB)

Backend service for storing and retrieving segmentation masks for an AI annotation tool.

## Tech Stack
- Node.js 18+
- TypeScript
- Express
- Mongoose

## Quick Start

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Create a MongoDB Atlas cluster (free tier) and obtain a connection string.
3. Copy `.env.example` to `.env` and set `MONGODB_URI` and `PORT` as needed.
4. Start the dev server:
   ```bash
   npm run dev
   ```
   Server starts on `http://localhost:3000` by default.

Build and run production:
```bash
npm run build
npm start
```

## Environment Variables
- `PORT` (default: 3000)
- `MONGODB_URI` – Atlas connection string (SRV)

## Data Model
See `MODEL.md` for complete data model, including User, Project, Image, and Annotation objects.

## API Overview
Base path: `/api`

- Health
  - `GET /api/health` – simple health check

- Projects
  - `POST /api/projects` – create a project
  - `GET /api/projects/:id` – get a project by id
  - `GET /api/projects/:id/stats` – project stats (images, annotations, per-annotator counts)

- Images
  - `POST /api/projects/:projectId/images` – bulk create images for a project
  - `GET /api/images/:id` – get image by id

- Annotations
  - `POST /api/annotations` – create/save an annotation
  - `GET /api/annotations/:id` – get annotation by id
  - `GET /api/annotations` – query annotations by `label`, `annotator`, `imageId`, `projectId` (supports pagination `page`, `limit`)
  - `GET /api/annotations/:id/rank` – get 1-based area rank of the annotation among all annotations on the same image

### Notes on Segmentation Representation
`Annotation.segmentation` supports two forms:
- Polygon: Multi-polygon with optional holes
- RLE: COCO-style run-length encoding with numeric `counts`

Area is stored in pixels. If `area` is omitted on creation, the server computes it from the segmentation (for RLE, numeric `counts` are required for server-side area computation).

Polygon area computation (shoelace formula):
- Each polygon contains `rings: [outer, ...holes]`, where each ring is an array of `[x,y]` coordinates with at least 3 points.
- The area of a ring is computed using the shoelace formula and holes are subtracted from the outer ring:
  - `area(polygon) = area(outer) - sum(area(hole_i))`, floored at 0.
- The total polygon segmentation area is the sum over all polygons.

RLE area computation (foreground run lengths):
- RLE uses `size: [height, width]` and `counts: number[]` where counts alternate background/foreground starting with background.
- The mask area is the sum of all foreground runs (odd indices when starting with background).

### Validation and Enforcement
- Input validation with Zod (`src/validation/segmentation.ts`):
  - Polygon: requires at least one polygon; each polygon must have at least one ring; each ring must have ≥3 `[x,y]` coordinates.
  - RLE: requires `size: [height, width]` with positive integers and `counts: number[]` with nonnegative integers.
- RLE size cross-check: `size` must match the image dimensions `(height, width)`; requests are rejected otherwise.
- Area enforcement: the server always computes `area` from the provided segmentation.
  - If the client also sends an `area`, it must match the server-computed value (within a tiny epsilon for floating polygons); mismatches are rejected.

## Running Tests / Linting
Not included for brevity in this take-home. Could be added with Jest and ESLint.
