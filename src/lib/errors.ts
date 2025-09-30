export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }
  static notFound(message: string) {
    return new ApiError(404, message);
  }
  static conflict(message: string, details?: unknown) {
    return new ApiError(409, message, details);
  }
  static internal(message = 'Internal Server Error', details?: unknown) {
    return new ApiError(500, message, details);
  }
}
