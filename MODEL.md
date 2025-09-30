# Data Model

This document describes the core MongoDB/Mongoose schemas, relationships, and relevant indexes for the Segmentation API.

## Entities

- **User** (`src/models/User.ts`)
  - Fields
    - `name: string` (required)
    - `email: string` (required, unique, indexed)
    - `role: 'annotator' | 'admin'` (default: `annotator`)
    - `passwordHash?: string` (only present for users created via `/auth/signup`)
    - `createdAt: Date`, `updatedAt: Date`
  - Notes
    - Email is unique; signup conflicts return 409.

- **Project** (`src/models/Project.ts`)
  - Fields
    - `name: string` (required)
    - `description?: string`
    - `status: 'active' | 'archived'` (default: `active`, indexed)
    - `createdBy?: ObjectId<User>`
    - `createdAt: Date`, `updatedAt: Date`
  - Indexes
    - `{ status: 1 }`

- **Image** (`src/models/Image.ts`)
  - Fields
    - `project: ObjectId<Project>` (required, indexed)
    - `uri: string` (required)
    - `width: number` (required)
    - `height: number` (required)
    - `status: 'unassigned' | 'in_progress' | 'annotated'` (default: `unassigned`, indexed)
    - `assignedTo?: ObjectId<User>`
    - `metadata?: object`
    - `createdAt: Date`, `updatedAt: Date`
  - Indexes
    - `{ project: 1 }`
    - `{ status: 1 }`

- **Annotation** (`src/models/Annotation.ts`)
  - Fields
    - `project: ObjectId<Project>` (required, indexed)
    - `image: ObjectId<Image>` (required, indexed)
    - `label: string` (required, indexed)
    - `segmentation: object` (required)
      - Polygon form:
        ```json
        {
          "type": "polygon",
          "polygons": [
            { "rings": [ [[x,y], [x,y], ...] ] }
          ]
        }
        ```
      - RLE form:
        ```json
        {
          "type": "rle",
          "size": [height, width],
          "counts": [runLengths...]
        }
        ```
    - `area: number` (required)
    - `createdBy?: ObjectId<User>` (indexed)
    - `metadata?: object`
    - `createdAt: Date`, `updatedAt: Date`
  - Indexes
    - `{ image: 1, area: -1 }` (supports rank by area within image)
    - `{ project: 1 }`
    - `{ image: 1 }`
    - `{ label: 1 }`
    - `{ createdBy: 1 }`

## Relationships

- `Project 1 - N Image`
- `Image 1 - N Annotation`
- `User 1 - N Project` (via `createdBy`)
- `User 1 - N Annotation` (via `createdBy`)

## Validation & Computation

- `segmentation` is validated using Zod schemas in `src/validation/segmentation.ts`.
- `area` is computed server-side by `computeSegmentationArea()` in `src/utils/area.ts`.
- For RLE, `size` must match the target `Image` dimensions; for polygons, each ring must close and contain at least 3 points.

## Example Payloads

- Create project
```json
{
  "name": "Demo Project",
  "description": "Example"
}
```

- Bulk add images
```json
{
  "images": [
    { "uri": "https://example.com/img1.jpg", "width": 640, "height": 480 }
  ]
}
```

- Create annotation (polygon)
```json
{
  "image": "<imageId>",
  "label": "cat",
  "segmentation": {
    "type": "polygon",
    "polygons": [ { "rings": [ [[10,10],[100,10],[100,100],[10,100]] ] } ]
  }
}
```

- Create annotation (RLE)
```json
{
  "image": "<imageId>",
  "label": "dog",
  "segmentation": { "type": "rle", "size": [480, 640], "counts": [1000, 200, 300, 150, 500] }
}
```

## Notes

- `createdBy` defaults to the authenticated user when present (see `src/controllers/annotationController.ts`).
- When `AUTH_REQUIRED=true`, write endpoints (create project, bulk images, create annotation) require a valid JWT.
- Error responses follow `{ error: { message, details? } }`.
