'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AdminCard, AdminPageHeader, AdminSelect, StatusBadge } from '../../components/AdminUI'
import type { CustomerOrder, OrderStatus } from '@/lib/airtable'

const statuses: OrderStatus[] = [
  'Pending',
  'Awaiting Payment',
  'Confirmed',
  'Shipped',
  'Cancelled',
]

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const [order, setOrder] = useState<CustomerOrder | null>(null)
  const [status, setStatus] = useState<OrderStatus>('Pending')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadOrder() {
      try {
        const response = await fetch(`/api/admin/orders/${params.id}`)
        if (!response.ok) throw new Error('Order not found')
        const data = (await response.json()) as { order: CustomerOrder }
        setOrder(data.order)
        setStatus(data.order.status as OrderStatus)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [params.id])

  async function handleSaveStatus() {
    if (!order) return

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to update status')
      }

      const data = (await response.json()) as { order: CustomerOrder }
      setOrder(data.order)
      setMessage('Status updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-neutral-600">Loading order...</p>
  if (!order) return <p className="text-red-600">{error || 'Order not found'}</p>

  return (
    <div>
      <AdminPageHeader
        title={order.orderId}
        description={`Placed ${order.orderDate ? new Date(order.orderDate).toLocaleString() : '—'}`}
        actions={<StatusBadge status={order.status} />}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AdminCard className="p-6">
          <h2 className="font-bebas text-2xl mb-4">CUSTOMER</h2>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-neutral-500">Email</dt><dd>{order.email}</dd></div>
            <div><dt className="text-neutral-500">Phone</dt><dd>{order.phone}</dd></div>
            <div><dt className="text-neutral-500">Location</dt><dd>{order.location}</dd></div>
            <div><dt className="text-neutral-500">Payment</dt><dd>{order.paymentMethod}</dd></div>
          </dl>
        </AdminCard>

        <AdminCard className="p-6">
          <h2 className="font-bebas text-2xl mb-4">TOTALS</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd>${order.subtotal.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">Shipping</dt><dd>${order.shipping.toFixed(2)}</dd></div>
            <div className="flex justify-between font-semibold text-lg"><dt>Total</dt><dd>${order.total.toFixed(2)}</dd></div>
          </dl>
        </AdminCard>

        <AdminCard className="p-6 xl:col-span-2">
          <h2 className="font-bebas text-2xl mb-4">ITEMS</h2>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={`${item.title}-${index}`} className="flex justify-between border-b border-black/5 pb-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-neutral-500">Size: {item.size} · Qty: {item.quantity}</p>
                </div>
                <p>${item.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="p-6 xl:col-span-2">
          <h2 className="font-bebas text-2xl mb-4">UPDATE STATUS</h2>
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            <div className="flex-1">
              <AdminSelect
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value as OrderStatus)}
              >
                {statuses.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </AdminSelect>
            </div>
            <button
              type="button"
              onClick={handleSaveStatus}
              disabled={saving}
              className="px-6 py-3 bg-black text-white font-bebas text-xl tracking-wider rounded-xl hover:bg-[var(--color-accent)] hover:text-black transition-colors disabled:opacity-50"
            >
              {saving ? 'SAVING...' : 'SAVE STATUS'}
            </button>
          </div>

          {message ? <p className="text-green-700 mt-4">{message}</p> : null}
          {error ? <p className="text-red-600 mt-4">{error}</p> : null}
        </AdminCard>
      </div>
    </div>
  )
}
