import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { BookPlus, ChevronLeft, ChevronRight, Loader2, PencilLine, Search, Trash2 } from "lucide-react"

import { booksApi } from "@/api/books.api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getErrorMessage } from "@/lib/errors"
import { bookFormSchema } from "@/lib/validation/book.schemas"
import { DEFAULT_BOOK_PAGE_SIZE } from "@/lib/bookFilters"
import type { Book, BookCreate } from "@/types/book.types"
import { z } from "zod"

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

type BookFormInput = z.input<typeof bookFormSchema>
type BookFormOutput = z.output<typeof bookFormSchema>

const EMPTY_BOOK: BookFormInput = {
  title: "",
  author: "",
  isbn: "",
  description: "",
  price: "",
  publisher: "",
  published_year: "",
  total_copies: 1,
}

function toPayload(values: BookFormOutput): BookCreate {
  return {
    title: values.title,
    author: values.author,
    isbn: values.isbn?.trim() ? values.isbn.trim() : null,
    description: values.description?.trim() ? values.description.trim() : null,
    price: values.price ?? null,
    publisher: values.publisher?.trim() ? values.publisher.trim() : null,
    published_year: values.published_year ?? null,
    total_copies: values.total_copies,
  }
}

function asFormValues(book: Book): BookFormInput {
  return {
    title: book.title,
    author: book.author,
    isbn: book.isbn ?? "",
    description: book.description ?? "",
    price: book.price ?? "",
    publisher: book.publisher ?? "",
    published_year: book.published_year ?? "",
    total_copies: book.total_copies,
  }
}

export default function ManageBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [draftFilters, setDraftFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(INITIAL_FILTERS)

  const form = useForm<BookFormInput, unknown, BookFormOutput>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: EMPTY_BOOK,
  })

  useEffect(() => {
    if (selectedBook) {
      form.reset(asFormValues(selectedBook))
    } else {
      form.reset(EMPTY_BOOK)
    }
  }, [form, selectedBook])

  useEffect(() => {
    const loadBooks = async () => {
      setIsLoading(true)
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
      } catch (error) {
        toast.error(getErrorMessage(error, "Couldn't load books."))
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

  const saveBook = async (values: BookFormOutput) => {
    setIsSaving(true)
    try {
      const payload = toPayload(values)
      if (selectedBook) {
        await booksApi.update(selectedBook.id, payload)
        toast.success("Book updated")
      } else {
        await booksApi.create(payload)
        toast.success("Book created")
      }

      setSelectedBook(null)
      form.reset(EMPTY_BOOK)
      setPage(1)
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
        skip: 0,
        limit: DEFAULT_BOOK_PAGE_SIZE,
      })
      setBooks(response.data)
      setTotal(response.total)
      setTotalPages(response.total_pages)
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't save this book."))
    } finally {
      setIsSaving(false)
    }
  }

  const editBook = (book: Book) => {
    setSelectedBook(book)
  }

  const deleteBook = async (book: Book) => {
    const confirmed = window.confirm(`Delete \"${book.title}\"? It can be restored from deleted books.`)
    if (!confirmed) return

    try {
      await booksApi.delete(book.id)
      toast.success("Book deleted")
      setSelectedBook((current) => (current?.id === book.id ? null : current))
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
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't delete this book."))
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <aside className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">Library ops</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">Manage books</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">Create, update, and delete book records.</p>
        </div>

        <form onSubmit={submitFilters} className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                className="pl-9"
                value={draftFilters.search_query}
                onChange={(event) => setDraftFilters((current) => ({ ...current, search_query: event.target.value }))}
                placeholder="Search books"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={draftFilters.author} onChange={(event) => setDraftFilters((current) => ({ ...current, author: event.target.value }))} placeholder="Author" />
            <Input value={draftFilters.title} onChange={(event) => setDraftFilters((current) => ({ ...current, title: event.target.value }))} placeholder="Title" />
            <Input value={draftFilters.publisher} onChange={(event) => setDraftFilters((current) => ({ ...current, publisher: event.target.value }))} placeholder="Publisher" />
            <Input value={draftFilters.isbn} onChange={(event) => setDraftFilters((current) => ({ ...current, isbn: event.target.value }))} placeholder="ISBN" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="number" value={draftFilters.published_year} onChange={(event) => setDraftFilters((current) => ({ ...current, published_year: event.target.value }))} placeholder="Published year" />
            <select className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900" value={draftFilters.available} onChange={(event) => setDraftFilters((current) => ({ ...current, available: event.target.value }))}>
              <option value="">All availability</option>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
            <select className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900" value={draftFilters.sortBy} onChange={(event) => setDraftFilters((current) => ({ ...current, sortBy: event.target.value }))}>
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="publisher">Publisher</option>
              <option value="published_year">Published year</option>
              <option value="isbn">ISBN</option>
            </select>
            <select className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900" value={draftFilters.sortOrder} onChange={(event) => setDraftFilters((current) => ({ ...current, sortOrder: event.target.value as "asc" | "desc" }))}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          <Button type="submit" className="w-full">
            Apply filters
          </Button>
        </form>

        <form onSubmit={form.handleSubmit(saveBook)} className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-center gap-2">
            <BookPlus className="h-4 w-4 text-neutral-500" />
            <h2 className="text-sm font-semibold text-neutral-900">{selectedBook ? `Editing #${selectedBook.id}` : "Create book"}</h2>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="author">Author</Label>
            <Input id="author" {...form.register("author")} />
            {form.formState.errors.author && <p className="text-sm text-red-600">{form.formState.errors.author.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="isbn">ISBN</Label>
            <Input id="isbn" {...form.register("isbn")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea id="description" rows={4} className="min-h-24 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400" {...form.register("description")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" step="0.01" {...form.register("price", { valueAsNumber: false })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="published_year">Published year</Label>
              <Input id="published_year" type="number" {...form.register("published_year", { valueAsNumber: false })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="publisher">Publisher</Label>
            <Input id="publisher" {...form.register("publisher")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="total_copies">Total copies</Label>
            <Input id="total_copies" type="number" {...form.register("total_copies", { valueAsNumber: false })} />
            {form.formState.errors.total_copies && <p className="text-sm text-red-600">{form.formState.errors.total_copies.message}</p>}
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? "Saving…" : selectedBook ? "Update book" : "Create book"}
            </Button>
            {selectedBook && (
              <Button type="button" variant="outline" onClick={() => setSelectedBook(null)}>
                Reset
              </Button>
            )}
          </div>
        </form>
      </aside>

      <main className="space-y-4">
        <div className="flex items-center justify-between gap-3 text-sm text-neutral-500">
          <p>
            {total} book{total === 1 ? "" : "s"} found
          </p>
          <p>
            Page {page} of {Math.max(totalPages, 1)}
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-neutral-400" />
            <p className="mt-3 text-sm text-neutral-500">Loading books…</p>
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-neutral-500">No books match the current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {books.map((book) => (
              <article key={book.id} className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">{book.title}</h2>
                    <p className="mt-1 text-sm text-neutral-500">by {book.author}</p>
                    <p className="mt-3 text-sm text-neutral-600">{book.description ?? "No description available."}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => editBook(book)}>
                      <PencilLine className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button type="button" variant="destructive" onClick={() => void deleteBook(book)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-neutral-500 sm:grid-cols-3">
                  <p>ISBN: {book.isbn ?? "—"}</p>
                  <p>Available: {book.available_copies}/{book.total_copies}</p>
                  <p>Publisher: {book.publisher ?? "—"}</p>
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
      </main>
    </section>
  )
}
