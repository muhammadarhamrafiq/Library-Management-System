import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Filter, Loader2, Search, ChevronLeft, ChevronRight, BookOpen, LibraryBig } from "lucide-react"

import { booksApi } from "@/api/books.api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/errors"
import { DEFAULT_BOOK_PAGE_SIZE } from "@/lib/bookFilters"
import { useAuthStore } from "@/stores/authStore"
import type { Book } from "@/types/book.types"

type FilterState = {
  search_query: string
  author: string
  title: string
  publisher: string
  isbn: string
  published_year: string
  available: string
  sortBy: string
  sortOrder: "asc" | "desc"
}

const INITIAL_FILTERS: FilterState = {
  search_query: "",
  author: "",
  title: "",
  publisher: "",
  isbn: "",
  published_year: "",
  available: "",
  sortBy: "title",
  sortOrder: "asc",
}

export default function BooksCatalogPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [books, setBooks] = useState<Book[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draftFilters, setDraftFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(INITIAL_FILTERS)

  useEffect(() => {
    const loadBooks = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await booksApi.list({
          search_query: appliedFilters.search_query || undefined,
          author: appliedFilters.author || undefined,
          title: appliedFilters.title || undefined,
          publisher: appliedFilters.publisher || undefined,
          isbn: appliedFilters.isbn || undefined,
          published_year: appliedFilters.published_year ? Number(appliedFilters.published_year) : undefined,
          available:
            appliedFilters.available === "true"
              ? true
              : appliedFilters.available === "false"
                ? false
                : undefined,
          sortBy: appliedFilters.sortBy || undefined,
          sortOrder: appliedFilters.sortOrder,
          skip: (page - 1) * DEFAULT_BOOK_PAGE_SIZE,
          limit: DEFAULT_BOOK_PAGE_SIZE,
        })

        setBooks(response.data)
        setTotal(response.total)
        setTotalPages(response.total_pages)
      } catch (requestError) {
        const message = getErrorMessage(requestError, "Couldn't load books.")
        setError(message)
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadBooks()
  }, [appliedFilters, page])

  const submitFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAppliedFilters(draftFilters)
    setPage(1)
  }

  return (
    <section className="space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">
              Catalogue
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Browse the library
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
              Search by title, author, publisher, ISBN, or year. Filters and paging are pushed to the backend.
            </p>
          </div>
          <div className="hidden rounded-2xl bg-neutral-950 px-4 py-3 text-white shadow-sm sm:block">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
            >
              Back to dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
            >
              Log in for dashboard tools
            </Link>
          )}
          <span className="text-sm text-neutral-500">Public browsing stays available for everyone.</span>
        </div>

        <form onSubmit={submitFilters} className="mt-6 grid gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 lg:grid-cols-2">
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-sm font-medium text-neutral-900">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                className="pl-9"
                placeholder="Search by title, author, publisher, or ISBN"
                value={draftFilters.search_query}
                onChange={(event) => setDraftFilters((current) => ({ ...current, search_query: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Author</label>
            <Input
              value={draftFilters.author}
              onChange={(event) => setDraftFilters((current) => ({ ...current, author: event.target.value }))}
              placeholder="Author"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Title</label>
            <Input
              value={draftFilters.title}
              onChange={(event) => setDraftFilters((current) => ({ ...current, title: event.target.value }))}
              placeholder="Title"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Publisher</label>
            <Input
              value={draftFilters.publisher}
              onChange={(event) => setDraftFilters((current) => ({ ...current, publisher: event.target.value }))}
              placeholder="Publisher"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">ISBN</label>
            <Input
              value={draftFilters.isbn}
              onChange={(event) => setDraftFilters((current) => ({ ...current, isbn: event.target.value }))}
              placeholder="ISBN"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Published year</label>
            <Input
              type="number"
              value={draftFilters.published_year}
              onChange={(event) => setDraftFilters((current) => ({ ...current, published_year: event.target.value }))}
              placeholder="2024"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Availability</label>
            <select
              className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900"
              value={draftFilters.available}
              onChange={(event) => setDraftFilters((current) => ({ ...current, available: event.target.value }))}
            >
              <option value="">All</option>
              <option value="true">Available only</option>
              <option value="false">Unavailable only</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Sort by</label>
            <select
              className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900"
              value={draftFilters.sortBy}
              onChange={(event) => setDraftFilters((current) => ({ ...current, sortBy: event.target.value }))}
            >
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="publisher">Publisher</option>
              <option value="published_year">Published year</option>
              <option value="isbn">ISBN</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Sort order</label>
            <select
              className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900"
              value={draftFilters.sortOrder}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, sortOrder: event.target.value as "asc" | "desc" }))
              }
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          <div className="flex items-end lg:col-span-2">
            <Button type="submit" className="w-full sm:w-auto">
              <Filter className="h-4 w-4" />
              Apply filters
            </Button>
          </div>
        </form>
      </div>

      <div className="flex items-center justify-between gap-4 text-sm text-neutral-500">
        <p>
          {total} book{total === 1 ? "" : "s"} found
        </p>
        <p>
          Page {page} of {Math.max(totalPages, 1)}
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-neutral-400" />
          <p className="mt-3">Loading books…</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <LibraryBig className="mx-auto h-8 w-8 text-neutral-300" />
          <h2 className="mt-3 text-lg font-semibold text-neutral-900">No books found</h2>
          <p className="mt-2 text-sm text-neutral-500">Try a different filter or search term.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => (
            <article key={book.id} className="flex h-full flex-col rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">{book.title}</h2>
                  <p className="mt-1 text-sm text-neutral-500">by {book.author}</p>
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                  {book.available_copies}/{book.total_copies} available
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-neutral-600">
                <p>ISBN: {book.isbn ?? "—"}</p>
                <p>Publisher: {book.publisher ?? "—"}</p>
                <p>Year: {book.published_year ?? "—"}</p>
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-500">
                {book.description ?? "No description available."}
              </p>

              <div className="mt-auto pt-5">
                <Link
                  to={`/books/${book.id}`}
                  className="inline-flex h-10 w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-3xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
        <Button type="button" variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <p className="text-sm text-neutral-500">
          Page {page} of {Math.max(totalPages, 1)}
        </p>
        <Button type="button" variant="outline" onClick={() => setPage((current) => current + 1)} disabled={page >= totalPages || isLoading}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  )
}
