import { isAxiosError } from "axios";

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (isAxiosError(error)) {
    // No response at all: the server is down or CORS is blocking it
    if (!error.response) return "Can't reach the server. Try again in a moment.";

    // Our own errors: 404 "Contact not found.", 409 "You already have..."
    const detail = error.response.data?.detail;
    if (typeof detail === "string") return detail;

    // FastAPI validation errors (422) send a list, not a string
    if (error.response.status === 422) {
      return "Some details look wrong. Please check them and try again.";
    }
  }
  return fallback;
}