'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AdminCard, AdminPageHeader } from '../components/AdminUI'
import type { CustomerSummary } from '@/lib/airtable'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCustomers() {
      try {
        const response = await fetch('/api/admin/customers')
        if (!response.ok) throw new Error('Failed to load customers')
        const data = (await response.json()) as { customers: CustomerSummary[] }
        setCustomers(data.customers)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customers')
      } finally {
        setLoading(false)
      }
    }

    loadCustomers()
  }, [])

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return customers
    return customers.filter(
      (customer) =>
        customer.email.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query)
    )
  }, [customers, search])

  return (
    <div>
      <AdminPageHeader
        title="CUSTOMERS"
        description="Customer profiles aggregated from order history."
      />

      <AdminCard className="p-4 mb-6">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by email or phone..."
          className="w-full px-4 py-3 bg-neutral-100 border border-black/10 rounded-xl focus:outline-none focus:border-black/30"
        />
      </AdminCard>

      {loading ? <p className="text-neutral-600">Loading customers...</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-50 border-b border-black/10">
                <tr>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Email</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Phone</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Orders</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Total spent</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Last order</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={`${customer.email}-${customer.phone}`} className="border-b border-black/5">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/customers/${encodeURIComponent(customer.email)}`}
                        className="font-semibold hover:underline"
                      >
                        {customer.email || 'No email'}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{customer.phone || '—'}</td>
                    <td className="px-6 py-4">{customer.orderCount}</td>
                    <td className="px-6 py-4">${customer.totalSpent.toFixed(2)}</td>
                    <td className="px-6 py-4 text-neutral-600">
                      {customer.lastOrderDate
                        ? new Date(customer.lastOrderDate).toLocaleString()
                        : '—'}
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
