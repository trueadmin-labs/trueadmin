export type TrueAdminStreamErrorReason = 'backend' | 'network' | 'aborted' | 'protocol';

export class TrueAdminStreamError extends Error {
  constructor(
    public readonly reason: TrueAdminStreamErrorReason,
    message: string,
    public readonly code = `STREAM.${reason.toUpperCase()}`,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'TrueAdminStreamError';
  }
}
