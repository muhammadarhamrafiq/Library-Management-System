import { Link } from "react-router-dom"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-neutral-900">Page not found</h1>
        <p className="mt-2 text-sm text-neutral-500">
          That page doesn't exist.{" "}
          <Link to="/" className="underline">
            Go home
          </Link>
        </p>
      </div>
    </div>
  )
}
