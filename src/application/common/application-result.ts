export class ApplicationResult<T = void> {
  constructor(
    public readonly isSuccess: boolean,
    public readonly data?: T,
    public readonly error?: string,
    public readonly errorCode?: string,
  ) {}

  static success<T>(data?: T): ApplicationResult<T> {
    return new ApplicationResult(true, data);
  }

  static failure<T = void>(error: string, errorCode?: string): ApplicationResult<T> {
    return new ApplicationResult<T>(false, undefined as any, error, errorCode);
  }

  static fromDomainResult<T>(domainResult: { isSuccess: boolean; data?: T; error?: string }): ApplicationResult<T> {
    return domainResult.isSuccess
      ? ApplicationResult.success(domainResult.data)
      : ApplicationResult.failure(domainResult.error || 'Unknown error');
  }
}