export abstract class BaseUseCase<TRequest, TResponse> {
  abstract execute(request: TRequest): Promise<TResponse>;
}

export abstract class BaseCommand<TRequest, TResponse> extends BaseUseCase<TRequest, TResponse> {}

export abstract class BaseQuery<TRequest, TResponse> extends BaseUseCase<TRequest, TResponse> {}