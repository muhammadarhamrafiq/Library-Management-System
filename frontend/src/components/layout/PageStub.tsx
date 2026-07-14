import { cn } from "@/lib/utils"

interface PageStubProps {
  title: string
  note?: string
  fullScreen?: boolean
  className?: string
}

export function PageStub({ title, note, fullScreen = true, className }: PageStubProps) {
  if (!fullScreen) {
    return (
      <section className={cn("w-full rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8", className)}>
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
          {note && <p className="mt-2 text-sm leading-6 text-neutral-500">{note}</p>}
        </div>
      </section>
    )
  }

  return (
    <div className={cn("flex min-h-screen items-center justify-center bg-neutral-50 px-4", className)}>
      <div className="text-center">
        <h1 className="text-2xl font-medium text-neutral-900">{title}</h1>
        {note && <p className="mt-2 text-sm text-neutral-500">{note}</p>}
      </div>
    </div>
  )
}
