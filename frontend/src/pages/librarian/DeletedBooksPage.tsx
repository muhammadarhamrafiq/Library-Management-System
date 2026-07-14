import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Loader2, RotateCcw, Search } from "lucide-react"

import { booksApi } from "@/api/books.api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/errors"
import { DEFAULT_BOOK_PAGE_SIZE } from "@/lib/bookFilters"
import type { Book } from "@/types/book.types"

export default function DeletedBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [search, setSearch] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDeletedBooks = async () => {
      setIsLoading(true)
      try {
        const response = await booksApi.listDeleted({
          search_query: appliedSearch || undefined,
          skip: (page - 1) * DEFAULT_BOOK_PAGE_SIZE,
          limit: DEFAULT_BOOK_PAGE_SIZE,
        })

        setBooks(response.data)
        setTotal(response.total)
        setTotalPages(response.total_pages)
      } catch (error) {
        toast.error(getErrorMessage(error, "Couldn't load deleted books."))
      } finally {
        setIsLoading(false)
      }
    }

    void loadDeletedBooks()
  }, [appliedSearch, page])

  const restoreBook = async (book: Book) => {
    try {
      await booksApi.restore(book.id)
      toast.success(`Restored \"${book.title}\"`)
      const response = await booksApi.listDeleted({
        search_query: appliedSearch || undefined,
        skip: (page - 1) * DEFAULT_BOOK_PAGE_SIZE,
        limit: DEFAULT_BOOK_PAGE_SIZE,
      })
      setBooks(response.data)
      setTotal(response.total)
      setTotalPages(response.total_pages)
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't restore this book."))
    }
  }

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAppliedSearch(search)
    setPage(1)
  }

  return (
    <section className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">Library ops</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">Deleted books</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-500">Search deleted books and restore them back into the catalogue.</p>
      </div>

      <form onSubmit={submitSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search deleted books" />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="flex items-center justify-between gap-3 text-sm text-neutral-500">
        <p>
          {total} deleted book{total === 1 ? "" : "s"}
        </p>
        <p>
          Page {page} of {Math.max(totalPages, 1)}
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-neutral-400" />
          <p className="mt-3">Loading deleted books…</p>
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          No deleted books found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => (
            <article key={book.id} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
              <h2 className="text-lg font-semibold text-neutral-900">{book.title}</h2>
              <p className="mt-1 text-sm text-neutral-500">by {book.author}</p>
              <p className="mt-4 text-sm text-neutral-600">Deleted on {book.deleted_at ? new Date(book.deleted_at).toLocaleString() : "—"}</p>
              <Button type="button" className="mt-5 w-full" onClick={() => void restoreBook(book)}>
                <RotateCcw className="h-4 w-4" />
                Restore
              </Button>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3">
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
