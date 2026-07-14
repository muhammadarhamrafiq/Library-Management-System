import { Link } from "react-router-dom"

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-neutral-900">Access denied</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Your account doesn't have permission to view this page.{" "}
          <Link to="/dashboard" className="underline">
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  )
}
