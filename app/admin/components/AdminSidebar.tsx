'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/homepage', label: 'Homepage' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="w-64 shrink-0 border-r border-black/10 bg-white min-h-screen p-6 flex flex-col">
      <div className="mb-10">
        <Link href="/admin" className="font-bebas text-3xl tracking-wide text-black">
          SPACE SHIRT
        </Link>
        <p className="text-xs uppercase tracking-wider text-neutral-500 mt-1">Admin Panel</p>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 rounded-xl font-bebas text-lg tracking-wide transition-colors ${
                active
                  ? 'bg-black text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {item.label.toUpperCase()}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-2 pt-6 border-t border-black/10">
        <Link
          href="/"
          className="block px-4 py-2 text-sm text-neutral-600 hover:text-black"
        >
          View Storefront
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-xl"
        >
          Log out
        </button>
      </div>
    </aside>
  )
}
