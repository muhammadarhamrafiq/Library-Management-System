import { useEffect, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  Loader2,
  Search,
  ShieldAlert,
  BadgeCheck,
  Ban,
  DollarSign,
} from "lucide-react"

import { loansApi } from "@/api/loans.api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export default function ManageLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [draftStatus, setDraftStatus] = useState<LoanStatus | "">("pending")
  const [draftOutstandingFine, setDraftOutstandingFine] = useState<string>("")
  const [draftUserId, setDraftUserId] = useState("")
  const [draftBookId, setDraftBookId] = useState("")
  const [statusFilter, setStatusFilter] = useState<LoanStatus | "">("pending")
  const [outstandingFineFilter, setOutstandingFineFilter] = useState<string>("")
  const [userIdFilter, setUserIdFilter] = useState("")
  const [bookIdFilter, setBookIdFilter] = useState("")
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
          outstanding_fine:
            outstandingFineFilter === "true" ? true : outstandingFineFilter === "false" ? false : undefined,
          user_id: userIdFilter ? Number(userIdFilter) : undefined,
          book_id: bookIdFilter ? Number(bookIdFilter) : undefined,
          skip: (page - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
        })

        setLoans(response.data)
        setTotal(response.total)
        setTotalPages(response.total_pages)
      } catch (error) {
        toast.error(getErrorMessage(error, "Couldn't load loans."))
      } finally {
        setIsLoading(false)
      }
    }

    void loadLoans()
  }, [bookIdFilter, outstandingFineFilter, page, statusFilter, userIdFilter])

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatusFilter(draftStatus)
    setOutstandingFineFilter(draftOutstandingFine)
    setUserIdFilter(draftUserId)
    setBookIdFilter(draftBookId)
    setPage(1)
  }

  const refreshLoans = async () => {
    const response = await loansApi.list({
      status: statusFilter || undefined,
      outstanding_fine:
        outstandingFineFilter === "true" ? true : outstandingFineFilter === "false" ? false : undefined,
      user_id: userIdFilter ? Number(userIdFilter) : undefined,
      book_id: bookIdFilter ? Number(bookIdFilter) : undefined,
      skip: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    })
    setLoans(response.data)
    setTotal(response.total)
    setTotalPages(response.total_pages)
  }

  const runAction = async (loanId: number, action: () => Promise<Loan>, successMessage: string) => {
    setIsUpdating(loanId)
    try {
      await action()
      toast.success(successMessage)
      await refreshLoans()
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't update this loan."))
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <section className="space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">Loan management</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">Manage loans</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
          Approve or reject pending requests, and manage fines for staff-handled loans.
        </p>

        <form onSubmit={applyFilters} className="mt-6 grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 lg:grid-cols-4">
          <div className="space-y-1.5 lg:col-span-2">
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Outstanding fine</label>
            <select
              className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900"
              value={draftOutstandingFine}
              onChange={(event) => setDraftOutstandingFine(event.target.value)}
            >
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">User ID</label>
            <Input value={draftUserId} onChange={(event) => setDraftUserId(event.target.value)} placeholder="User ID" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Book ID</label>
            <Input value={draftBookId} onChange={(event) => setDraftBookId(event.target.value)} placeholder="Book ID" />
          </div>

          <div className="lg:col-span-4">
            <Button type="submit" className="w-full sm:w-auto">
              Apply filters
            </Button>
          </div>
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
          <p className="mt-3 text-sm text-neutral-500">Loading loans…</p>
        </div>
      ) : loans.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-8 w-8 text-neutral-300" />
          <h2 className="mt-3 text-lg font-semibold text-neutral-900">No loans found</h2>
          <p className="mt-2 text-sm text-neutral-500">Try a different filter combination.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {loans.map((loan) => (
            <article key={loan.id} className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">Loan #{loan.id}</p>
                  <h2 className="mt-2 text-lg font-semibold text-neutral-900">
                    User #{loan.user_id} • Book #{loan.book_id}
                  </h2>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(loan.status)}`}>
                  {statusLabel(loan.status)}
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-neutral-600 sm:grid-cols-2">
                <p>Due date: {new Date(loan.due_date).toLocaleDateString()}</p>
                <p>Returned: {loan.returned_date ? new Date(loan.returned_date).toLocaleString() : "—"}</p>
                <p>Renewals used: {loan.renew_count}</p>
                <p>
                  Fine: {loan.fine_amount > 0 ? `$${loan.fine_amount.toFixed(2)}` : "No fine"}
                  {loan.fine_paid ? " (paid)" : ""}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to={`/books/${loan.book_id}`}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
                >
                  View book
                </Link>

                {loan.status === "pending" && (
                  <>
                    <Button
                      type="button"
                      onClick={() => void runAction(loan.id, () => loansApi.approve(loan.id), "Loan approved")}
                      disabled={isUpdating === loan.id}
                    >
                      <BadgeCheck className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => void runAction(loan.id, () => loansApi.reject(loan.id), "Loan rejected")}
                      disabled={isUpdating === loan.id}
                    >
                      <Ban className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}

                {loan.fine_amount > 0 && !loan.fine_paid && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void runAction(loan.id, () => loansApi.payFine(loan.id), "Fine marked as paid")}
                    disabled={isUpdating === loan.id}
                  >
                    <DollarSign className="h-4 w-4" />
                    Mark fine paid
                  </Button>
                )}

                {(loan.status === "approved" || loan.status === "overdue") && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void runAction(loan.id, () => loansApi.return(loan.id), "Loan marked as returned")}
                    disabled={isUpdating === loan.id}
                  >
                    <CircleCheckBig className="h-4 w-4" />
                    Mark returned
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
