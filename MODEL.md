# Data Model

This document describes the core MongoDB/Mongoose schemas, relationships, and relevant indexes for the Segmentation API.

## Entities

- **User** (`src/models/User.ts`)
  - Fields
    - `name: string` (required)
    - `email: string` (required, unique, stored lowercased and trimmed)
    - `role: 'annotator' | 'admin'` (default: `annotator`; signup always creates annotators, admins are promoted in the database)
    - `passwordHash?: string` (only present for users created via `/auth/signup`)
    - `createdAt: Date`, `updatedAt: Date`
  - Notes
    - Email is unique; signup conflicts return 409.
    - `passwordHash` is bcrypt with cost 12.

- **Project** (`src/models/Project.ts`)
  - Fields
    - `name: string` (required)
    - `description?: string`
    - `status: 'active' | 'archived'` (default: `active`, indexed)
    - `createdBy?: ObjectId<User>` (the owner; set from the caller's token)
    - `createdAt: Date`, `updatedAt: Date`
  - Indexes
    - `{ status: 1 }`
  - Access
    - Only the owner and admins can read the project or anything inside it.

- **Image** (`src/models/Image.ts`)
  - Fields
    - `project: ObjectId<Project>` (required, indexed)
    - `uri: string` (required)
    - `width: number` (required)
    - `height: number` (required)
    - `status: 'unassigned' | 'in_progress' | 'annotated'` (default: `unassigned`, indexed; set to `annotated` when an annotation is created, never by the import)
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
    - `createdBy?: ObjectId<User>` (indexed; set from the caller's token)
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

- `segmentation` is validated using Zod schemas in `src/validation/segmentation.ts`; request bodies and queries use `src/validation/requests.ts`.
- `area` is computed server-side by `computeSegmentationArea()` in `src/utils/area.ts`.
- For RLE, `size` must match the target `Image` dimensions and `counts` must add up to exactly `height x width`.
- For polygons, each ring needs at least 3 points (the last point connects back to the first) and every point must lie within `0..width` x `0..height` of the image.

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
  "segmentation": { "type": "rle", "size": [480, 640], "counts": [1000, 200, 305850, 150] }
}
```

## Notes

- `createdBy` on projects and annotations is always the authenticated caller; a value in the request body is ignored.
- Every project, image and annotation endpoint requires a valid JWT.
- Error responses follow `{ error: { message, details? } }`.
