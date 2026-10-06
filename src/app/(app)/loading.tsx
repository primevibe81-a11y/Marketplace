export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded bg-muted" />
        <div className="h-4 w-72 max-w-full rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-28 rounded-lg bg-muted" />
        <div className="h-28 rounded-lg bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-16 rounded-lg bg-muted" />
        <div className="h-16 rounded-lg bg-muted" />
        <div className="h-16 rounded-lg bg-muted" />
      </div>
    </div>
  )
}
