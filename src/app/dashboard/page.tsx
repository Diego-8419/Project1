'use client'

/**
 * Company Selector Page
 * Benutzer wählt eine Firma aus oder erstellt eine neue
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getUserCompanies, createCompany, deleteCompany, generateSlug, isSlugAvailable, type CompanyWithRole } from '@/lib/db/companies'
import { FEATURES } from '@/config/features'

export default function CompanySelectorPage() {
  const router = useRouter()
  const supabase = createClient()

  const [companies, setCompanies] = useState<CompanyWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canCreateCompany, setCanCreateCompany] = useState(false)

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const userCompanies = await getUserCompanies(supabase, user.id)
      setCompanies(userCompanies)

      // Prüfe ob User Firmen erstellen darf
      if (FEATURES.ALLOW_USER_CREATE_COMPANY) {
        // Jeder kann Firmen erstellen
        setCanCreateCompany(true)
      } else {
        // Nur Admins können neue Firmen erstellen
        const hasAdminRole = userCompanies.some(c => c.role === 'admin')
        setCanCreateCompany(hasAdminRole)
      }
    } catch (err: any) {
      console.error('Error loading companies:', err)
      setError('Fehler beim Laden der Firmen')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht angemeldet')

      // Generiere Slug
      let slug = generateSlug(newCompanyName)

      // Prüfe, ob Slug verfügbar ist
      const available = await isSlugAvailable(supabase, slug)
      if (!available) {
        // Füge Zufallszahl hinzu
        slug = `${slug}-${Math.floor(Math.random() * 10000)}`
      }

      // Erstelle Firma
      const company = await createCompany(supabase, {
        name: newCompanyName,
        slug,
        userId: user.id,
      })

      // Weiterleiten
      router.push(`/${company.slug}/todos`)
    } catch (err: any) {
      console.error('Error creating company:', err)
      setError(err.message || 'Fehler beim Erstellen der Firma')
    } finally {
      setCreating(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`Möchten Sie die Firma "${companyName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!`)) {
      return
    }

    try {
      await deleteCompany(supabase, companyId)
      loadCompanies()
    } catch (err: any) {
      console.error('Error deleting company:', err)
      alert('Fehler beim Löschen der Firma')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Firmen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center shadow">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl text-gray-900 dark:text-white">
                <em className="font-light italic">Just</em> <span className="font-bold">To Do</span>
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Firma auswählen</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
          >
            Abmelden
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Companies Grid */}
        {companies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition p-6 border-2 border-transparent hover:border-teal-500 relative group"
              >
                {/* Löschen-Button für Admins */}
                {company.role === 'admin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCompany(company.id, company.name)
                    }}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Firma löschen"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}

                <button
                  onClick={() => router.push(`/${company.slug}/todos`)}
                  className="w-full text-left"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {company.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    /{company.slug}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      company.role === 'admin'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                        : company.role === 'gl'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                        : company.role === 'superuser'
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {company.role === 'admin' ? 'Administrator' :
                       company.role === 'gl' ? 'Geschäftsleitung' :
                       company.role === 'superuser' ? 'Superuser' : 'Benutzer'}
                    </span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* No Companies Message */}
        {companies.length === 0 && !showCreateForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center mb-8">
            <div className="text-6xl mb-4">🏢</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Keine Firmen gefunden
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {canCreateCompany
                ? 'Erstellen Sie Ihre erste Firma, um zu beginnen.'
                : 'Sie wurden noch keiner Firma zugewiesen. Bitte kontaktieren Sie Ihren Administrator.'}
            </p>
          </div>
        )}

        {/* Create Company Button/Form - Nur für Admins */}
        {canCreateCompany && (
          !showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <span className="text-2xl">+</span>
              <span>Neue Firma erstellen</span>
            </button>
          ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Neue Firma erstellen
            </h3>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Firmenname
                </label>
                <input
                  id="companyName"
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="z.B. Meine Firma GmbH"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating || !newCompanyName.trim()}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Wird erstellt...' : 'Erstellen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewCompanyName('')
                    setError(null)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
          )
        )}
      </div>
    </div>
  )
}
