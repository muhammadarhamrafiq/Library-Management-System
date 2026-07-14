import { useCallback, useEffect, useState } from "react"
import type { PaginatedResponse } from "@/types/pagination.types"

/**
 * Page-based pagination for endpoints that return the
 * {data, total, page, total_pages, has_next, has_previous} envelope
 * (books, loans, users list endpoints).
 */
export function usePagination<T>(
  fetchPage: (skip: number, limit: number) => Promise<PaginatedResponse<T>>,
  limit = 10
) {
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<PaginatedResponse<T> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (targetPage: number) => {
      setIsLoading(true)
      setError(null)
      try {
        const skip = (targetPage - 1) * limit
        const res = await fetchPage(skip, limit)
        setResult(res)
        setPage(targetPage)
      } catch {
        setError("Couldn't load results. Try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [fetchPage, limit]
  )

  useEffect(() => {
    load(1)
  }, [load])

  return {
    items: result?.data ?? [],
    total: result?.total ?? 0,
    page,
    totalPages: result?.total_pages ?? 1,
    hasNext: result?.has_next ?? false,
    hasPrevious: result?.has_previous ?? false,
    isLoading,
    error,
    nextPage: () => result?.has_next && load(page + 1),
    prevPage: () => result?.has_previous && load(page - 1),
    goToPage: (targetPage: number) => load(targetPage),
    refresh: () => load(page),
  }
}
