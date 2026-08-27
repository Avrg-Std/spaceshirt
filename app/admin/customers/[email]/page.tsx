'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AdminCard, AdminPageHeader, StatusBadge } from '../../components/AdminUI'
import type { CustomerOrder, CustomerSummary } from '@/lib/airtable'

export default function AdminCustomerDetailPage() {
  const params = useParams<{ email: string }>()
  const [customer, setCustomer] = useState<CustomerSummary | null>(null)
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCustomer() {
      try {
        const response = await fetch(
          `/api/admin/customers/${encodeURIComponent(params.email)}`
        )
        if (!response.ok) throw new Error('Customer not found')
        const data = (await response.json()) as {
          customer: CustomerSummary
          orders: CustomerOrder[]
        }
        setCustomer(data.customer)
        setOrders(data.orders)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customer')
      } finally {
        setLoading(false)
      }
    }

    loadCustomer()
  }, [params.email])

  if (loading) return <p className="text-neutral-600">Loading customer...</p>
  if (!customer) return <p className="text-red-600">{error || 'Customer not found'}</p>

  return (
    <div>
      <AdminPageHeader
        title={customer.email || 'Customer'}
        description={`${customer.orderCount} orders · $${customer.totalSpent.toFixed(2)} total spent`}
      />

      <AdminCard className="p-6 mb-6">
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div><dt className="text-neutral-500">Email</dt><dd>{customer.email || '—'}</dd></div>
          <div><dt className="text-neutral-500">Phone</dt><dd>{customer.phone || '—'}</dd></div>
          <div>
            <dt className="text-neutral-500">Last order</dt>
            <dd>
              {customer.lastOrderDate
                ? new Date(customer.lastOrderDate).toLocaleString()
                : '—'}
            </dd>
          </div>
        </dl>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-black/10">
              <tr>
                <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Order</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Date</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Total</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-black/5">
                  <td className="px-6 py-4">
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold hover:underline">
                      {order.orderId}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-neutral-600">
                    {order.orderDate ? new Date(order.orderDate).toLocaleString() : '—'}
                  </td>
                  <td className="px-6 py-4">${order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  )
}
