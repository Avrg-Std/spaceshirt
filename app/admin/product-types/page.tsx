'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { AdminCard, AdminInput, AdminPageHeader, AdminSelect } from '../components/AdminUI'
import {
  PRODUCT_TYPE_GENDERS,
  type ProductTypeGender,
} from '@/lib/product-sizes'

type ProductTypeRow = {
  id: string
  name: string
  gender: ProductTypeGender
  sortOrder: number
  active: boolean
}

export default function AdminProductTypesPage() {
  const [types, setTypes] = useState<ProductTypeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newGender, setNewGender] = useState<ProductTypeGender>('MEN')
  const [creating, setCreating] = useState(false)

  async function loadTypes() {
    setError('')
    try {
      const response = await fetch('/api/admin/product-types')
      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to load product types')
      }
      const data = (await response.json()) as { types: ProductTypeRow[] }
      setTypes(data.types || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product types')
      setTypes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTypes()
  }, [])

  const grouped = useMemo(() => {
    return PRODUCT_TYPE_GENDERS.map((gender) => ({
      gender,
      items: types
        .filter((type) => type.gender === gender)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    }))
  }, [types])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setCreating(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/product-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, gender: newGender, active: true }),
      })
      const data = (await response.json()) as { type?: ProductTypeRow; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Failed to create type')
      setNewName('')
      setMessage(`Added "${data.type?.name}" for ${newGender}`)
      await loadTypes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create type')
    } finally {
      setCreating(false)
    }
  }

  async function patchType(
    id: string,
    patch: Partial<Pick<ProductTypeRow, 'name' | 'sortOrder' | 'active' | 'gender'>>
  ) {
    setSavingId(id)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`/api/admin/product-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = (await response.json()) as { type?: ProductTypeRow; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Failed to update type')
      setTypes((current) =>
        current.map((type) => (type.id === id ? (data.type as ProductTypeRow) : type))
      )
      setMessage('Saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update type')
      await loadTypes()
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(type: ProductTypeRow) {
    if (!confirm(`Delete "${type.name}" from ${type.gender}?`)) return
    setSavingId(type.id)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`/api/admin/product-types/${type.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to delete type')
      }
      setTypes((current) => current.filter((entry) => entry.id !== type.id))
      setMessage(`Deleted "${type.name}"`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete type')
    } finally {
      setSavingId(null)
    }
  }

  async function moveType(type: ProductTypeRow, direction: -1 | 1) {
    const siblings = types
      .filter((entry) => entry.gender === type.gender)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    const index = siblings.findIndex((entry) => entry.id === type.id)
    const swapWith = siblings[index + direction]
    if (!swapWith) return

    const nextOrder = swapWith.sortOrder
    const otherOrder = type.sortOrder
    await patchType(type.id, { sortOrder: nextOrder })
    await patchType(swapWith.id, { sortOrder: otherOrder })
    await loadTypes()
  }

  return (
    <div>
      <AdminPageHeader
        title="PRODUCT TYPES"
        description="Manage MEN and WOMEN filter options shown on the storefront."
      />

      {error ? (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          {message}
        </p>
      ) : null}

      <AdminCard className="p-6 mb-8 max-w-3xl">
        <h2 className="font-bebas text-2xl tracking-wide mb-4">ADD TYPE</h2>
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-[1fr_160px_auto] md:items-end">
          <AdminInput
            label="Name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="e.g. Hoodies & jackets"
            required
          />
          <AdminSelect
            label="Gender"
            value={newGender}
            onChange={(event) => setNewGender(event.target.value as ProductTypeGender)}
          >
            {PRODUCT_TYPE_GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </AdminSelect>
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="px-6 py-3 bg-black text-white font-bebas text-xl tracking-wider rounded-xl hover:bg-[var(--color-accent)] hover:text-black transition-colors disabled:opacity-50"
          >
            {creating ? 'ADDING...' : 'ADD'}
          </button>
        </form>
      </AdminCard>

      {loading ? <p className="text-neutral-600">Loading product types...</p> : null}

      {!loading
        ? grouped.map(({ gender, items }) => (
            <AdminCard key={gender} className="overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-black/10 bg-neutral-50">
                <h2 className="font-bebas text-2xl tracking-wide">{gender}</h2>
              </div>
              {items.length === 0 ? (
                <p className="px-6 py-8 text-neutral-500">No types yet.</p>
              ) : (
                <ul className="divide-y divide-black/5">
                  {items.map((type, index) => (
                    <li
                      key={type.id}
                      className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4"
                    >
                      <input
                        type="text"
                        defaultValue={type.name}
                        key={`${type.id}-${type.name}`}
                        onBlur={(event) => {
                          const next = event.target.value.trim()
                          if (!next || next === type.name) return
                          void patchType(type.id, { name: next })
                        }}
                        className="flex-1 px-3 py-2 bg-neutral-100 border border-black/10 rounded-xl focus:outline-none focus:border-black/30"
                        disabled={savingId === type.id}
                      />
                      <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          checked={type.active}
                          onChange={(event) =>
                            void patchType(type.id, { active: event.target.checked })
                          }
                          disabled={savingId === type.id}
                        />
                        Active
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="px-3 py-2 text-sm border border-black/10 rounded-xl hover:bg-neutral-100 disabled:opacity-40"
                          disabled={index === 0 || savingId === type.id}
                          onClick={() => void moveType(type, -1)}
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2 text-sm border border-black/10 rounded-xl hover:bg-neutral-100 disabled:opacity-40"
                          disabled={index === items.length - 1 || savingId === type.id}
                          onClick={() => void moveType(type, 1)}
                        >
                          Down
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-40"
                          disabled={savingId === type.id}
                          onClick={() => void handleDelete(type)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          ))
        : null}
    </div>
  )
}
