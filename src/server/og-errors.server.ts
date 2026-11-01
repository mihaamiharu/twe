export class OgRenderError extends Error {
  constructor(
    readonly status: 422 | 503,
    message: string,
  ) {
    super(message);
    this.name = 'OgRenderError';
  }
}
