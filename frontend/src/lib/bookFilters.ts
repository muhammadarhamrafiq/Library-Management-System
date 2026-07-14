import type { BookListParams } from "@/types/book.types"

export const DEFAULT_BOOK_PAGE_SIZE = 8

export function getBookSearchParams(searchParams: URLSearchParams) {
  return {
    search_query: searchParams.get("search_query") ?? "",
    author: searchParams.get("author") ?? "",
    title: searchParams.get("title") ?? "",
    publisher: searchParams.get("publisher") ?? "",
    isbn: searchParams.get("isbn") ?? "",
    published_year: searchParams.get("published_year") ?? "",
    available: searchParams.get("available") ?? "",
    sortBy: searchParams.get("sortBy") ?? "title",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc" | null) ?? "asc",
    page: Number(searchParams.get("page") ?? "1") || 1,
  }
}

export function toBookListParams(values: ReturnType<typeof getBookSearchParams>): BookListParams {
  return {
    search_query: values.search_query || undefined,
    author: values.author || undefined,
    title: values.title || undefined,
    publisher: values.publisher || undefined,
    isbn: values.isbn || undefined,
    published_year: values.published_year ? Number(values.published_year) : undefined,
    available:
      values.available === "true" ? true : values.available === "false" ? false : undefined,
    sortBy: values.sortBy || undefined,
    sortOrder: values.sortOrder,
  }
}

export function setBookSearchParams(
  searchParams: URLSearchParams,
  values: ReturnType<typeof getBookSearchParams>
) {
  const next = new URLSearchParams(searchParams)
  const entries: Array<[string, string | number | boolean | undefined]> = [
    ["search_query", values.search_query],
    ["author", values.author],
    ["title", values.title],
    ["publisher", values.publisher],
    ["isbn", values.isbn],
    ["published_year", values.published_year],
    ["available", values.available],
    ["sortBy", values.sortBy],
    ["sortOrder", values.sortOrder],
    ["page", values.page],
  ]

  next.forEach((_, key) => next.delete(key))

  for (const [key, value] of entries) {
    if (value !== undefined && value !== "") {
      next.set(key, String(value))
    }
  }

  return next
}