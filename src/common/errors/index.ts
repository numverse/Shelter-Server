import { errorMessages } from "./errorMessages";

export class AppError {
  code: string;
  message: string;
  error: string;
  statusCode: number;

  constructor(errorMessage: keyof typeof errorMessages) {
    const { code, message, error, statusCode } = errorMessages[errorMessage];
    this.code = code;
    this.message = message;
    this.error = error;
    this.statusCode = statusCode;
  }
}
