import { useEffect, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Clock3, Loader2, Search, XCircle } from "lucide-react"

import { loansApi } from "@/api/loans.api"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/errors"
import type { Loan, LoanStatus } from "@/types/loan.types"

const PAGE_SIZE = 8

const STATUS_OPTIONS: Array<{ label: string; value: LoanStatus | "" }> = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Returned", value: "returned" },
  { label: "Overdue", value: "overdue" },
  { label: "Rejected", value: "rejected" },
  { label: "Canceled", value: "canceled" },
]

function statusLabel(status: LoanStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function statusClasses(status: LoanStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "returned":
      return "bg-neutral-100 text-neutral-700 border-neutral-200"
    case "overdue":
      return "bg-red-50 text-red-700 border-red-200"
    case "rejected":
    case "canceled":
      return "bg-neutral-100 text-neutral-500 border-neutral-200"
  }
}

export default function MyLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [statusFilter, setStatusFilter] = useState<LoanStatus | "">("pending")
  const [draftStatus, setDraftStatus] = useState<LoanStatus | "">("pending")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<number | null>(null)

  useEffect(() => {
    const loadLoans = async () => {
      setIsLoading(true)
      try {
        const response = await loansApi.list({
          status: statusFilter || undefined,
          skip: (page - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
        })

        setLoans(response.data)
        setTotal(response.total)
        setTotalPages(response.total_pages)
      } catch (error) {
        toast.error(getErrorMessage(error, "Couldn't load your loans."))
      } finally {
        setIsLoading(false)
      }
    }

    void loadLoans()
  }, [page, statusFilter])

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatusFilter(draftStatus)
    setPage(1)
  }

  const cancelLoan = async (loanId: number) => {
    setIsUpdating(loanId)
    try {
      await loansApi.cancel(loanId)
      toast.success("Loan request canceled")
      const response = await loansApi.list({
        status: statusFilter || undefined,
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      })
      setLoans(response.data)
      setTotal(response.total)
      setTotalPages(response.total_pages)
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't cancel this request."))
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <section className="space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">Member loans</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">My loans</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
          Track your borrow requests and cancel any request that is still pending.
        </p>

        <form onSubmit={submitFilters} className="mt-6 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Status</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <select
                className="h-10 w-full rounded-md border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-900"
                value={draftStatus}
                onChange={(event) => setDraftStatus(event.target.value as LoanStatus | "")}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" className="sm:w-auto">
            Apply filter
          </Button>
        </form>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-neutral-500">
        <p>
          {total} loan{total === 1 ? "" : "s"}
        </p>
        <p>
          Page {page} of {Math.max(totalPages, 1)}
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-neutral-400" />
          <p className="mt-3 text-sm text-neutral-500">Loading your loans…</p>
        </div>
      ) : loans.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <Clock3 className="mx-auto h-8 w-8 text-neutral-300" />
          <h2 className="mt-3 text-lg font-semibold text-neutral-900">No loans found</h2>
          <p className="mt-2 text-sm text-neutral-500">Try a different filter or create a new borrow request from the catalogue.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loans.map((loan) => (
            <article key={loan.id} className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">Loan #{loan.id}</p>
                  <h2 className="mt-2 text-lg font-semibold text-neutral-900">Book #{loan.book_id}</h2>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(loan.status)}`}>
                  {statusLabel(loan.status)}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-neutral-600">
                <p>Due date: {new Date(loan.due_date).toLocaleDateString()}</p>
                <p>Returned: {loan.returned_date ? new Date(loan.returned_date).toLocaleString() : "—"}</p>
                <p>Renewals used: {loan.renew_count}</p>
                <p>
                  Fine: {loan.fine_amount > 0 ? `$${loan.fine_amount.toFixed(2)}` : "No fine"}
                  {loan.fine_paid ? " (paid)" : ""}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Link
                  to={`/books/${loan.book_id}`}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
                >
                  View book
                </Link>
                {loan.status === "pending" && (
                  <Button type="button" variant="destructive" onClick={() => void cancelLoan(loan.id)} disabled={isUpdating === loan.id}>
                    <XCircle className="h-4 w-4" />
                    {isUpdating === loan.id ? "Canceling…" : "Cancel request"}
                  </Button>
                )}
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
