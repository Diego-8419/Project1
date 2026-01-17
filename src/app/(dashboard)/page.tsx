'use client'

/**
 * Company Selector Page
 * Benutzer wählt eine Firma aus oder erstellt eine neue
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getUserCompanies, createCompany, generateSlug, isSlugAvailable, type CompanyWithRole } from '@/lib/db/companies'

export default function CompanySelectorPage() {
  const router = useRouter()
  const supabase = createClient()

  const [companies, setCompanies] = useState<CompanyWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      // Wenn nur eine Firma, direkt weiterleiten
      if (userCompanies.length === 1) {
        router.push(`/${userCompanies[0].slug}/todos`)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Firmen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Firma auswählen
          </h1>
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
              <button
                key={company.id}
                onClick={() => router.push(`/${company.slug}/todos`)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition p-6 text-left border-2 border-transparent hover:border-blue-500"
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
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {company.role === 'admin' ? 'Administrator' : company.role === 'gl' ? 'Geschäftsleitung' : 'Benutzer'}
                  </span>
                </div>
              </button>
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
              Erstellen Sie Ihre erste Firma, um zu beginnen.
            </p>
          </div>
        )}

        {/* Create Company Button/Form */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating || !newCompanyName.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
        )}
      </div>
    </div>
  )
}
