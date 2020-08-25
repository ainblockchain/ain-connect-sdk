export const enum STATUS_CODE {
  success = '0',
  invalidParams = '1',
  unexpected = '500',
}

export class CustomError extends Error {
  static MESSAGE = {
    0: 'success',
    1: 'It is invalid Parameter',
    500: 'It is Unexpected Error',
  };

  private errorMessage?: string

  constructor(private statusCode: string) {
    super();
    this.name = 'CustomError';
    if (!CustomError.MESSAGE[statusCode]) {
      this.statusCode = '500';
    }
    this.errorMessage = CustomError.MESSAGE[this.statusCode];
  }

  showAlert() {
    return `CustomError [statusCode: ${this.statusCode}, message: ${this.errorMessage}]`;
  }

  getData() {
    return { statusCode: this.statusCode, errorMessage: this.errorMessage };
  }
}
