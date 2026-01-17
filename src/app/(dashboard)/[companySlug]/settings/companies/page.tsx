'use client'

/**
 * Companies Management Page (Admin Only)
 * Admins können Firmen erstellen, bearbeiten und löschen
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { useCompanyStore } from '@/lib/stores/companyStore'
import { getUserCompanies, createCompany, updateCompany, deleteCompany, generateSlug, isSlugAvailable, type CompanyWithRole } from '@/lib/db/companies'

export default function CompaniesPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()
  const { currentCompany } = useCompanyStore()

  const [companies, setCompanies] = useState<CompanyWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyWithRole | null>(null)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanySlug, setNewCompanySlug] = useState('')
  const [editCompanyName, setEditCompanyName] = useState('')
  const [editCompanySlug, setEditCompanySlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = currentCompany?.role === 'admin'

  useEffect(() => {
    if (user) {
      loadCompanies()
    }
  }, [user])

  const loadCompanies = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await getUserCompanies(supabase, user.id)
      setCompanies(data)
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      // Slug generieren falls leer
      const slug = newCompanySlug || generateSlug(newCompanyName)

      // Slug verfügbarkeit prüfen
      const available = await isSlugAvailable(supabase, slug)
      if (!available) {
        setError('Dieser URL-Name ist bereits vergeben. Bitte wählen Sie einen anderen.')
        setSaving(false)
        return
      }

      // Firma erstellen
      await createCompany(supabase, {
        name: newCompanyName,
        slug,
        userId: user.id,
      })

      setShowCreateModal(false)
      setNewCompanyName('')
      setNewCompanySlug('')
      await loadCompanies()
      router.refresh()
    } catch (err: any) {
      console.error('Error creating company:', err)
      setError(err.message || 'Fehler beim Erstellen der Firma')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCompany) return

    setSaving(true)
    setError(null)

    try {
      // Wenn Slug geändert wurde, Verfügbarkeit prüfen
      if (editCompanySlug !== editingCompany.slug) {
        const available = await isSlugAvailable(supabase, editCompanySlug)
        if (!available) {
          setError('Dieser URL-Name ist bereits vergeben. Bitte wählen Sie einen anderen.')
          setSaving(false)
          return
        }
      }

      await updateCompany(supabase, editingCompany.id, {
        name: editCompanyName,
      })

      setShowEditModal(false)
      setEditingCompany(null)
      setEditCompanyName('')
      setEditCompanySlug('')
      loadCompanies()
    } catch (err: any) {
      console.error('Error updating company:', err)
      setError(err.message || 'Fehler beim Aktualisieren der Firma')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCompany = async (company: CompanyWithRole) => {
    if (!confirm(`Möchten Sie die Firma "${company.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return
    }

    try {
      await deleteCompany(supabase, company.id)
      loadCompanies()
    } catch (err: any) {
      console.error('Error deleting company:', err)
      alert('Fehler beim Löschen der Firma: ' + (err.message || 'Unbekannter Fehler'))
    }
  }

  const handleEditClick = (company: CompanyWithRole) => {
    setEditingCompany(company)
    setEditCompanyName(company.name)
    setEditCompanySlug(company.slug)
    setShowEditModal(true)
    setError(null)
  }

  const handleAutoGenerateSlug = () => {
    const slug = generateSlug(newCompanyName)
    setNewCompanySlug(slug)
  }

  const handleAutoGenerateEditSlug = () => {
    const slug = generateSlug(editCompanyName)
    setEditCompanySlug(slug)
  }

  if (!currentCompany) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-6 py-4 rounded-lg">
          <p className="font-medium">Keine Berechtigung</p>
          <p className="text-sm mt-1">Nur Administratoren können Firmen verwalten.</p>
        </div>
      </div>
    )
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    gl: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
    superuser: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200',
    user: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Firmen verwalten
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {companies.length} Firma(n)
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true)
            setError(null)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Firma erstellen
        </button>
      </div>

      {/* Companies List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Firmen...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name / URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ihre Rolle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Erstellt
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {company.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        /{company.slug}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[company.role]}`}>
                      {company.role === 'admin' ? 'Administrator' : company.role === 'gl' ? 'Geschäftsleitung' : company.role === 'superuser' ? 'Superuser' : 'Benutzer'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(company.created_at).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      {company.role === 'admin' && (
                        <>
                          <button
                            onClick={() => handleEditClick(company)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDeleteCompany(company)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          >
                            Löschen
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Company Modal */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowCreateModal(false)}
          ></div>

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Firma erstellen
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateCompany} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="companySlug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      URL-Name (Slug)
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateSlug}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Auto-generieren
                    </button>
                  </div>
                  <input
                    id="companySlug"
                    type="text"
                    value={newCompanySlug}
                    onChange={(e) => setNewCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="meine-firma"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Wird automatisch generiert, falls leer. Nur Kleinbuchstaben, Zahlen und Bindestriche.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving || !newCompanyName}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Wird erstellt...' : 'Erstellen'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Edit Company Modal */}
      {showEditModal && editingCompany && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowEditModal(false)}
          ></div>

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Firma bearbeiten
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateCompany} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="editCompanyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Firmenname
                  </label>
                  <input
                    id="editCompanyName"
                    type="text"
                    required
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="editCompanySlug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      URL-Name (Slug)
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateEditSlug}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Auto-generieren
                    </button>
                  </div>
                  <input
                    id="editCompanySlug"
                    type="text"
                    required
                    value={editCompanySlug}
                    onChange={(e) => setEditCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Nur Kleinbuchstaben, Zahlen und Bindestriche.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving || !editCompanyName || !editCompanySlug}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Wird gespeichert...' : 'Speichern'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
