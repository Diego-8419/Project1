'use client'

/**
 * Dashboard Layout
 * Gemeinsames Layout für alle Dashboard-Seiten mit Sidebar und Header
 */

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCompanyBySlug, getUserCompanyMembership } from '@/lib/db/companies'
import { useCompanyStore } from '@/lib/stores/companyStore'
import { useAuthStore } from '@/lib/stores/authStore'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { setCurrentCompany, clearCompany } = useCompanyStore()
  const { user, setUser } = useAuthStore()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Extract company slug from pathname
  const companySlug = pathname?.split('/')[1]
  const isCompanyRoute = companySlug && companySlug !== 'dashboard'

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (isCompanyRoute && user) {
      loadCompany()
    } else {
      clearCompany()
      setLoading(false)
    }
  }, [companySlug, user])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
    } else {
      router.push('/login')
    }
  }

  const loadCompany = async () => {
    if (!companySlug || !user) return

    try {
      const company = await getCompanyBySlug(supabase, companySlug)
      if (!company) {
        router.push('/dashboard')
        return
      }

      const membership = await getUserCompanyMembership(supabase, user.id, company.id)
      if (!membership) {
        router.push('/dashboard')
        return
      }

      setCurrentCompany({ ...company, role: membership.role })
    } catch (error) {
      console.error('Error loading company:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Show loading for company routes
  if (isCompanyRoute && loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade...</p>
        </div>
      </div>
    )
  }

  // Company selector page - no sidebar/header
  if (!isCompanyRoute) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </div>
    )
  }

  // Company routes - with sidebar/header
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}
