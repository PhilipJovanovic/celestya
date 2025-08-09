export type BaseError = {
  error: string;
  message: string;
};

export type Success<S> = {
  data: S;
};

/**
 * A Result type that represents either a successful value (Ok) or an error (Err).
 * This is a discriminated union type that helps handle errors in a type-safe way.
 *
 * @template T - The type of the successful value
 * @template E - The type of the error, must extend BaseError
 */
export type Result<T, E extends BaseError> = Ok<T, E> | Err<T, E>;

interface IResult<T, E extends BaseError> {
  /**
   * Checks if the `Result` is an `Ok` instance
   */
  isOk: () => this is Ok<T, E>;

  /**
   * Checks if the `Result` is an `Err` instance.
   */
  isErr: () => this is Err<T, E>;
}

/**
 * Represents a successful `Result` value.
 *
 * @template T - The type of the successful value.
 * @template E - The type of the error, must extend `BaseError`.
 */
export class Ok<T, E extends BaseError> implements IResult<T, E> {
  value: Success<T>;

  constructor(value: Success<T>) {
    this.value = value;
  }

  isOk(): this is Ok<T, E> {
    return true;
  }

  isErr(): this is Err<T, E> {
    return false;
  }
}

/**
 * Represents an error `Result` value.
 *
 * @template T - The type of the successful value.
 * @template E - The type of the error, must extend `BaseError`.
 */
export class Err<T, E extends BaseError> implements IResult<T, E> {
  error: E;

  constructor(error: E) {
    this.error = error;
  }

  isOk(): this is Ok<T, E> {
    return false;
  }

  isErr(): this is Err<T, E> {
    return true;
  }
}

/**
 * Creates a new successful `Result` (i.e., an instance of `Ok`).
 *
 * @template T - The type of the successful value
 * @param value - The successful value
 * @returns A new `Ok` instance.
 */
export function ok<const T>(value: Success<T>): Result<T, never> {
  return new Ok(value);
}

/**
 * Creates a new error `Result` (i.e., an instance of `Err`).
 *
 * @template E - The type of the error, must extend `BaseError`.
 * @param error - The error value.
 * @returns A new `Err` instance.
 */
export function err<const E extends BaseError>(error: E): Result<never, E> {
  return new Err(error);
}
