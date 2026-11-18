'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminSelect } from './AdminUI'
import {
  DEFAULT_PRODUCT_CATEGORIES,
  canonicalizeCategory,
  normalizeProductTypeGender,
  type ProductTypeGender,
} from '@/lib/product-sizes'

type ProductTypeOption = {
  id: string
  name: string
  gender: ProductTypeGender
  active: boolean
}

export default function AdminProductTaxonomy({
  defaultCategory = 'MEN',
  defaultCollection = '',
}: {
  defaultCategory?: string
  defaultCollection?: string
}) {
  const [category, setCategory] = useState(
    () => canonicalizeCategory(defaultCategory) || 'MEN'
  )
  const [collection, setCollection] = useState(defaultCollection)
  const [types, setTypes] = useState<ProductTypeOption[]>([])
  const [loadingTypes, setLoadingTypes] = useState(false)

  const gender = normalizeProductTypeGender(category)

  const categoryOptions = useMemo(() => {
    const set = new Set<string>([...DEFAULT_PRODUCT_CATEGORIES])
    if (defaultCategory.trim()) {
      set.add(canonicalizeCategory(defaultCategory))
    }
    return Array.from(set)
  }, [defaultCategory])

  useEffect(() => {
    let isMounted = true

    async function loadTypes() {
      setLoadingTypes(true)
      try {
        const query = gender
          ? `?gender=${encodeURIComponent(gender)}&activeOnly=true`
          : '?activeOnly=true'
        const response = await fetch(`/api/admin/product-types${query}`)
        if (!response.ok) throw new Error('Failed to load product types')
        const data = (await response.json()) as { types: ProductTypeOption[] }
        if (isMounted) setTypes(data.types || [])
      } catch {
        if (isMounted) setTypes([])
      } finally {
        if (isMounted) setLoadingTypes(false)
      }
    }

    loadTypes()
    return () => {
      isMounted = false
    }
  }, [gender])

  useEffect(() => {
    if (!collection) return
    if (types.length === 0) return
    const valid = types.some(
      (type) => type.name.toLowerCase() === collection.toLowerCase()
    )
    if (!valid) setCollection('')
  }, [types, collection])

  return (
    <>
      <AdminSelect
        label="Category"
        name="category"
        value={category}
        onChange={(event) => {
          setCategory(event.target.value)
          setCollection('')
        }}
        required
      >
        {categoryOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </AdminSelect>

      <AdminSelect
        label="Product type"
        name="collection"
        value={collection}
        onChange={(event) => setCollection(event.target.value)}
        disabled={!gender || loadingTypes}
      >
        <option value="">{gender ? 'None' : 'Select MEN or WOMEN first'}</option>
        {types.map((type) => (
          <option key={type.id} value={type.name}>
            {type.name}
          </option>
        ))}
      </AdminSelect>
    </>
  )
}
