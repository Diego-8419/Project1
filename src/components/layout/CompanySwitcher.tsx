'use client'

/**
 * Company Switcher Component
 * Dropdown zum schnellen Wechseln zwischen Firmen
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getUserCompanies, type CompanyWithRole } from '@/lib/db/companies'
import { useCompanyStore } from '@/lib/stores/companyStore'

export default function CompanySwitcher() {
  const router = useRouter()
  const supabase = createClient()
  const { currentCompany } = useCompanyStore()

  const [companies, setCompanies] = useState<CompanyWithRole[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const userCompanies = await getUserCompanies(supabase, user.id)
      setCompanies(userCompanies)
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompanySwitch = (companySlug: string) => {
    setIsOpen(false)
    router.push(`/${companySlug}/todos`)
  }

  const handleCreateNew = () => {
    setIsOpen(false)
    router.push('/dashboard')
  }

  if (loading || !currentCompany) {
    return (
      <div className="w-48 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
    )
  }

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
      >
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {currentCompany.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {currentCompany.role === 'admin' ? 'Administrator' : currentCompany.role === 'gl' ? 'Geschäftsleitung' : 'Benutzer'}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20 overflow-hidden">
            {/* Companies List */}
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Firmen
              </div>
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleCompanySwitch(company.slug)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                    currentCompany?.id === company.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {company.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        /{company.slug}
                      </div>
                    </div>
                    {currentCompany?.id === company.id && (
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        company.role === 'admin'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                          : company.role === 'gl'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {company.role === 'admin' ? 'Administrator' : company.role === 'gl' ? 'Geschäftsleitung' : 'Benutzer'}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={handleCreateNew}
                className="w-full px-3 py-2 text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Neue Firma erstellen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
