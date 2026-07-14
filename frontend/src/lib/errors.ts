import { isAxiosError } from "axios"

/**
 * FastAPI's HTTPException-based errors respond with {"detail": "..."}.
 * Falls back to a generic message for network errors / unexpected shapes.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === "string") return detail
  }
  return fallback
}
