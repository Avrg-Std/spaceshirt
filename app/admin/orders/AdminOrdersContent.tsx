'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AdminCard, AdminPageHeader, StatusBadge } from '../components/AdminUI'
import type { CustomerOrder } from '@/lib/airtable'

const statuses = ['', 'Pending', 'Awaiting Payment', 'Confirmed', 'Shipped', 'Cancelled']

export default function AdminOrdersContent() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadOrders() {
      setLoading(true)
      setError('')

      try {
        const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ''
        const response = await fetch(`/api/admin/orders${query}`)
        if (!response.ok) throw new Error('Failed to load orders')
        const data = (await response.json()) as { orders: CustomerOrder[] }
        setOrders(data.orders)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [statusFilter])

  return (
    <div>
      <AdminPageHeader
        title="ORDERS"
        description="View and update customer orders from Airtable."
      />

      <AdminCard className="p-4 mb-6">
        <label className="block text-xs font-bold text-neutral-600 tracking-wider mb-2 uppercase">
          Filter by status
        </label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-full md:w-64 px-4 py-3 bg-neutral-100 border border-black/10 rounded-xl"
        >
          <option value="">All statuses</option>
          {statuses.filter(Boolean).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </AdminCard>

      {loading ? <p className="text-neutral-600">Loading orders...</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-50 border-b border-black/10">
                <tr>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Order</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Date</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Customer</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Total</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Payment</th>
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
                    <td className="px-6 py-4">
                      <div>{order.email}</div>
                      <div className="text-sm text-neutral-500">{order.phone}</div>
                    </td>
                    <td className="px-6 py-4">${order.total.toFixed(2)}</td>
                    <td className="px-6 py-4">{order.paymentMethod}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      ) : null}
    </div>
  )
}
