import { Suspense } from 'react'
import AdminOrdersContent from './AdminOrdersContent'

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<p className="text-neutral-600">Loading orders...</p>}>
      <AdminOrdersContent />
    </Suspense>
  )
}
