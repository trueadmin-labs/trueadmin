export type StreamErrorReason = 'backend' | 'network' | 'aborted' | 'protocol';

export class StreamError extends Error {
  constructor(
    public readonly reason: StreamErrorReason,
    message: string,
    public readonly code = `STREAM.${reason.toUpperCase()}`,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'StreamError';
  }
}
