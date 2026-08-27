import type { ReactNode } from 'react'

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 className="font-bebas text-4xl tracking-wide text-black">{title}</h1>
        {description ? <p className="text-neutral-600 mt-1">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}

export function AdminCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[var(--radius-2xl)] bg-white border border-black/10 ${className}`}>
      {children}
    </div>
  )
}

export function AdminInput({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-bold text-neutral-600 tracking-wider mb-2 uppercase">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-4 py-3 bg-neutral-100 border border-black/10 rounded-xl focus:outline-none focus:border-black/30"
      />
    </div>
  )
}

export function AdminTextarea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-xs font-bold text-neutral-600 tracking-wider mb-2 uppercase">
        {label}
      </label>
      <textarea
        {...props}
        className="w-full px-4 py-3 bg-neutral-100 border border-black/10 rounded-xl focus:outline-none focus:border-black/30 min-h-[120px]"
      />
    </div>
  )
}

export function AdminSelect({
  label,
  children,
  ...props
}: { label: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-xs font-bold text-neutral-600 tracking-wider mb-2 uppercase">
        {label}
      </label>
      <select
        {...props}
        className="w-full px-4 py-3 bg-neutral-100 border border-black/10 rounded-xl focus:outline-none focus:border-black/30"
      >
        {children}
      </select>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    'Awaiting Payment': 'bg-orange-100 text-orange-800',
    Confirmed: 'bg-green-100 text-green-800',
    Shipped: 'bg-blue-100 text-blue-800',
    Cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
        styles[status] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {status}
    </span>
  )
}
