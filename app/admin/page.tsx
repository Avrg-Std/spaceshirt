import Link from 'next/link'
import { getOrders, getProducts } from '@/lib/airtable'

export default async function AdminDashboardPage() {
  const [products, orders] = await Promise.all([getProducts(), getOrders()])

  const pendingOrders = orders.filter(
    (order) => order.status === 'Pending' || order.status === 'Awaiting Payment'
  ).length

  const stats = [
    { label: 'Total Products', value: products.length, href: '/admin/products' },
    { label: 'Total Orders', value: orders.length, href: '/admin/orders' },
    { label: 'Pending Orders', value: pendingOrders, href: '/admin/orders?status=Pending' },
    {
      label: 'Low Stock',
      value: products.filter((product) => product.stock !== null && product.stock <= 5).length,
      href: '/admin/products',
    },
  ]

  return (
    <div>
      <h1 className="font-bebas text-4xl tracking-wide mb-8 text-black">DASHBOARD</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-[var(--radius-2xl)] bg-white border border-black/10 p-6 hover:border-black/30 transition-colors"
          >
            <p className="text-sm uppercase tracking-wider text-neutral-500 mb-2">{stat.label}</p>
            <p className="font-bebas text-5xl text-black">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-[var(--radius-2xl)] bg-white border border-black/10 p-6">
        <h2 className="font-bebas text-2xl tracking-wide mb-4">QUICK LINKS</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-black text-white font-bebas tracking-wide rounded-xl hover:bg-[var(--color-accent)] hover:text-black transition-colors"
          >
            ADD PRODUCT
          </Link>
          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-neutral-100 font-bebas tracking-wide rounded-xl hover:bg-neutral-200 transition-colors"
          >
            VIEW ORDERS
          </Link>
          <Link
            href="/admin/homepage"
            className="px-4 py-2 bg-neutral-100 font-bebas tracking-wide rounded-xl hover:bg-neutral-200 transition-colors"
          >
            CURATE HOMEPAGE
          </Link>
        </div>
      </div>
    </div>
  )
}
