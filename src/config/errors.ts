export class EnvError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid environment: ${issues.join('; ')}`);
    this.name = 'EnvError';
  }
}
