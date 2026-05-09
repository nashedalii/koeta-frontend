'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('auth')
    if (!raw) { router.replace('/'); return }
    try {
      const auth = JSON.parse(raw)
      if (auth?.user?.role !== 'admin' && auth?.user?.role !== 'super_admin') { router.replace('/'); return }
      setReady(true)
    } catch {
      localStorage.removeItem('auth')
      router.replace('/')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('auth')
    router.push('/')
  }

  if (!ready) {
    return (
      <div className="loading-screen">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <Sidebar userRole="Admin" onLogout={handleLogout} />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
