import type { ReactNode } from "react"
import { Link } from "react-router-dom"

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="text-lg font-medium text-neutral-900">
            Library
          </Link>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-medium text-neutral-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && (
          <div className="mt-6 text-center text-sm text-neutral-500">{footer}</div>
        )}
      </div>
    </div>
  )
}
