import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, BookOpen, CalendarDays, Loader2, PencilLine, ShieldUser, Users } from "lucide-react"

import { booksApi } from "@/api/books.api"
import { loansApi } from "@/api/loans.api"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/errors"
import { useAuthStore } from "@/stores/authStore"
import type { Book } from "@/types/book.types"

export default function BookDetailPage() {
  const { id } = useParams()
  const role = useAuthStore((state) => state.role)
  const [book, setBook] = useState<Book | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBorrowing, setIsBorrowing] = useState(false)

  useEffect(() => {
    let active = true

    const loadBook = async () => {
      setIsLoading(true)
      try {
        const currentBook = await booksApi.getById(Number(id))
        if (active) setBook(currentBook)
      } catch (error) {
        toast.error(getErrorMessage(error, "Couldn't load this book."))
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadBook()

    return () => {
      active = false
    }
  }, [id])

  const handleBorrow = async () => {
    if (!book) return

    setIsBorrowing(true)
    try {
      await loansApi.borrow({ book_id: book.id })
      toast.success("Borrow request submitted")
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't borrow this book."))
    } finally {
      setIsBorrowing(false)
    }
  }

  return (
    <section className="space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <Link to="/books" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" />
        Back to catalogue
      </Link>

      {isLoading ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-neutral-400" />
          <p className="mt-3 text-sm text-neutral-500">Loading book details…</p>
        </div>
      ) : !book ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-neutral-500">Book not found.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">Book details</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">{book.title}</h1>
                <p className="mt-2 text-base text-neutral-500">by {book.author}</p>
              </div>
              <div className="rounded-2xl bg-neutral-950 px-4 py-3 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Available</p>
                <p className="mt-2 text-lg font-semibold text-neutral-900">
                  {book.available_copies}/{book.total_copies}
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">ISBN</p>
                <p className="mt-2 text-sm font-medium text-neutral-900">{book.isbn ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Year</p>
                <p className="mt-2 text-sm font-medium text-neutral-900">{book.published_year ?? "—"}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-sm leading-6 text-neutral-600">
              <p>{book.description ?? "No description available for this title."}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 p-4">
                  <div className="flex items-center gap-2 text-neutral-700">
                    <ShieldUser className="h-4 w-4" />
                    Publisher
                  </div>
                  <p className="mt-2 text-neutral-900">{book.publisher ?? "—"}</p>
                </div>
                <div className="rounded-2xl border border-neutral-200 p-4">
                  <div className="flex items-center gap-2 text-neutral-700">
                    <CalendarDays className="h-4 w-4" />
                    Updated
                  </div>
                  <p className="mt-2 text-neutral-900">{new Date(book.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </article>

          <aside className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">Actions</p>
              <h2 className="mt-2 text-xl font-semibold text-neutral-900">What you can do</h2>
            </div>

            {role === "member" ? (
              <Button type="button" className="w-full" onClick={() => void handleBorrow()} disabled={isBorrowing || book.available_copies <= 0}>
                {isBorrowing ? "Submitting…" : book.available_copies > 0 ? "Borrow this book" : "Unavailable"}
              </Button>
            ) : role === "librarian" || role === "admin" ? (
              <Link
                to="/manage/books"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                <PencilLine className="h-4 w-4" />
                Manage books
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                <Users className="h-4 w-4" />
                Log in to borrow
              </Link>
            )}

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
              Members can submit a borrow request here. Librarians and admins manage books from the secure dashboard.
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}
