'use client'

import { useSyncExternalStore } from 'react'
import {
  addToCart,
  clearCart,
  getCartItems,
  removeCartItem,
  subscribeToCart,
  updateCartItemQuantity,
  type CartItem,
} from '@/lib/cart'

type CartSnapshot = {
  items: CartItem[]
  itemCount: number
  subtotal: number
}

const SERVER_SNAPSHOT: CartSnapshot = {
  items: [],
  itemCount: 0,
  subtotal: 0,
}

let lastCartSignature: string | null = null
let lastSnapshot: CartSnapshot = SERVER_SNAPSHOT

function getSnapshot() {
  const items = getCartItems()
  const signature = JSON.stringify(items)

  if (signature === lastCartSignature) {
    return lastSnapshot
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  lastCartSignature = signature
  lastSnapshot = {
    items,
    itemCount,
    subtotal,
  }

  return lastSnapshot
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT
}

export function useCart() {
  const snapshot = useSyncExternalStore(subscribeToCart, getSnapshot, getServerSnapshot)

  return {
    items: snapshot.items,
    itemCount: snapshot.itemCount,
    subtotal: snapshot.subtotal,
    addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => addToCart(item, quantity),
    removeItem: removeCartItem,
    updateQuantity: updateCartItemQuantity,
    clearCart,
  }
}
