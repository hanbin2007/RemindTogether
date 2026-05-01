/**
 * Domain errors thrown by the service layer. The API route handlers turn
 * these into HTTP responses via {@link handleApiError} so service code
 * stays HTTP-agnostic.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export class UnauthorizedError extends HttpError {
  constructor() {
    super(401, "unauthorized", "请先登录");
  }
}

export class ForbiddenError extends HttpError {
  constructor(reason = "forbidden") {
    super(403, reason, "没有权限");
  }
}

export class NotFoundError extends HttpError {
  constructor(what = "not_found") {
    super(404, what, "资源不存在");
  }
}

export class ConflictError extends HttpError {
  constructor(reason = "conflict", message?: string) {
    super(409, reason, message);
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(reason = "rate_limited", message?: string) {
    super(429, reason, message);
  }
}

export class BadRequestError extends HttpError {
  constructor(reason = "bad_request", message?: string) {
    super(400, reason, message);
  }
}
