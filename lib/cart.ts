'use client'

export type CartItem = {
  id: string
  title: string
  image: string
  price: number
  quantity: number
  size: string
}

const CART_STORAGE_KEY = 'spaceshirt-cart'
const CART_EVENT = 'cart-updated'

function emitCartChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CART_EVENT))
  }
}

function readCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as CartItem[]
  } catch {
    return []
  }
}

function writeCartToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  emitCartChange()
}

export function getCartItems(): CartItem[] {
  return readCartFromStorage()
}

export function getCartCount(): number {
  return getCartItems().reduce((sum, item) => sum + item.quantity, 0)
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1) {
  const currentItems = readCartFromStorage()
  const existingIndex = currentItems.findIndex(
    (existing) => existing.id === item.id && existing.size === item.size
  )

  if (existingIndex >= 0) {
    currentItems[existingIndex] = {
      ...currentItems[existingIndex],
      quantity: currentItems[existingIndex].quantity + quantity,
    }
  } else {
    currentItems.push({ ...item, quantity })
  }

  writeCartToStorage(currentItems)
}

export function updateCartItemQuantity(id: string, size: string, quantity: number) {
  const currentItems = readCartFromStorage()
  const nextItems = currentItems
    .map((item) => {
      if (item.id === id && item.size === size) {
        return { ...item, quantity }
      }
      return item
    })
    .filter((item) => item.quantity > 0)

  writeCartToStorage(nextItems)
}

export function removeCartItem(id: string, size: string) {
  const currentItems = readCartFromStorage()
  const nextItems = currentItems.filter((item) => !(item.id === id && item.size === size))
  writeCartToStorage(nextItems)
}

export function subscribeToCart(listener: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(CART_EVENT, listener)
  window.addEventListener('storage', listener)

  return () => {
    window.removeEventListener(CART_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
