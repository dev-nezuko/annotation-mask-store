# Data Model

This backend stores projects, images, users, and annotations. Below are the core objects and fields.

## User
| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Unique identifier |
| name | string | Display name |
| email | string | Email (unique) |
| role | string | `annotator` or `admin` |
| createdAt | Date | Timestamp when created |
| updatedAt | Date | Timestamp when updated |

## Project
| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Unique identifier |
| name | string | Project name |
| description | string | Optional project description |
| status | string | `active` or `archived` (default `active`) |
| createdBy | ObjectId(User) | Creator/admin reference |
| createdAt | Date | Timestamp when created |
| updatedAt | Date | Timestamp when updated |

## Image
| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Unique identifier |
| project | ObjectId(Project) | Owning project |
| uri | string | Image URI/path (e.g., S3 or CDN) |
| width | number | Image width in pixels |
| height | number | Image height in pixels |
| status | string | `unassigned`, `in_progress`, or `annotated` |
| assignedTo | ObjectId(User) | Optional assigned annotator |
| metadata | object | Arbitrary key-value pairs |
| createdAt | Date | Timestamp when created |
| updatedAt | Date | Timestamp when updated |

## Segmentation
Supports non-rectangular masks.

- Polygon segmentation (multi-polygon with optional holes):
```
{
  type: 'polygon',
  polygons: [
    { rings: [ [[x,y], [x,y], ...], [[x,y], ...] /* optional holes */ ] },
    ...
  ]
}
```

- RLE segmentation (COCO-style run-length encoding with numeric counts):
```
{
  type: 'rle',
  size: [height, width],
  counts: [n0, n1, n2, ...] // numeric counts, starting with background
}
```

## Annotation
| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Unique identifier |
| project | ObjectId(Project) | Derived from image's project if not provided |
| image | ObjectId(Image) | Target image |
| label | string | Class or object label |
| segmentation | object | Polygon or RLE representation (see above) |
| area | number | Area in pixels (always computed; optional input must match) |
| createdBy | ObjectId(User) | Annotator reference |
| metadata | object | Arbitrary key-value pairs |
| createdAt | Date | Timestamp when created |
| updatedAt | Date | Timestamp when updated |

### Indexes
- Annotation: `{ label: 1 }`, `{ createdBy: 1 }`, `{ image: 1 }`, `{ project: 1 }`, `{ image: 1, area: -1 }`
- Image: `{ project: 1 }`, `{ status: 1 }`
- Project: `{ status: 1 }`
- User: `{ email: 1 }` (unique)

## Ranking Definition
For a given annotation A on image I, its rank is defined as:
```
rank(A) = 1 + count( annotations on I with area > area(A) )
```
This is a 1-based competition rank. Equal areas share a rank; the next rank skips tied positions (for example 1, 1, 3).
