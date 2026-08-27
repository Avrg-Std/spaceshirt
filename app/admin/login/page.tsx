import { Suspense } from 'react'
import AdminLoginForm from './AdminLoginForm'

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<p className="min-h-screen flex items-center justify-center">Loading...</p>}>
      <AdminLoginForm />
    </Suspense>
  )
}
