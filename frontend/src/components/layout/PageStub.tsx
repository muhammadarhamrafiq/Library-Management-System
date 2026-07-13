interface PageStubProps {
  title: string
  note?: string
}

export function PageStub({ title, note }: PageStubProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-neutral-900">{title}</h1>
        {note && <p className="mt-2 text-sm text-neutral-500">{note}</p>}
      </div>
    </div>
  )
}
