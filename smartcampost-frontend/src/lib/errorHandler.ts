import { TFunction } from "i18next";
import { API_ERROR_CODES, ApiError } from "./api";

/**
 * Get a user-friendly error message from an error object
 * Uses i18n translations when available
 */
export function getErrorMessage(err: unknown, t: TFunction): string {
  // Check if it's an ApiError with a code
  if (err && typeof err === "object" && "code" in err) {
    const apiError = err as ApiError;
    const i18nKey = API_ERROR_CODES[apiError.code];
    if (i18nKey) {
      return t(i18nKey);
    }
    // If we have a message from the server, use it
    if (apiError.message) {
      return apiError.message;
    }
  }

  // Check for Axios-style errors
  if (err && typeof err === "object" && "response" in err) {
    const axiosError = err as {
      response?: { status?: number; data?: { message?: string } };
    };
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.response?.status) {
      return getHttpStatusMessage(axiosError.response.status, t);
    }
  }

  // Fallback for Error objects
  if (err instanceof Error) {
    // Don't expose raw HTTP errors to users
    if (err.message.startsWith("HTTP ")) {
      const status = parseInt(err.message.split(" ")[1], 10);
      if (!isNaN(status)) {
        return getHttpStatusMessage(status, t);
      }
    }
    return err.message;
  }

  // Default fallback
  return t("errors.unknownError");
}

/**
 * Get a translated message for an HTTP status code
 */
export function getHttpStatusMessage(status: number, t: TFunction): string {
  switch (status) {
    case 400:
      return t("errors.validationError");
    case 401:
      return t("errors.invalidCredentials");
    case 403:
      return t("errors.permissionDenied");
    case 404:
      return t("errors.notFound");
    case 409:
      return t("errors.conflict");
    case 423:
      return t("errors.accountLocked");
    case 500:
      return t("errors.serverError");
    case 503:
      return t("errors.serviceUnavailable");
    default:
      return t("errors.unknownError");
  }
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(err: unknown): boolean {
  if (err && typeof err === "object" && "code" in err) {
    return (err as ApiError).code === "NETWORK_ERROR";
  }
  if (err instanceof TypeError && err.message.includes("fetch")) {
    return true;
  }
  return false;
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status: number }).status;
    return status === 401 || status === 403;
  }
  return false;
}
