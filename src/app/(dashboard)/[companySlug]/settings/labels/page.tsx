'use client'

/**
 * Labels Settings Page
 * Admin kann Bezeichnungen für Firma und Rollen anpassen
 */

import { useEffect, useState } from 'react'
import { useCompanyStore } from '@/lib/stores/companyStore'
import { createClient } from '@/lib/supabase/client'
import { isAdmin } from '@/lib/utils/permissions'

interface CustomLabels {
  company?: string
  roles?: {
    admin?: string
    gl?: string
    superuser?: string
    user?: string
  }
}

const DEFAULT_LABELS: CustomLabels = {
  company: 'Firma',
  roles: {
    admin: 'Administrator',
    gl: 'Geschäftsleitung',
    superuser: 'Superuser',
    user: 'Benutzer',
  },
}

export default function LabelsSettingsPage() {
  const supabase = createClient()
  const { currentCompany, setCurrentCompany } = useCompanyStore()

  const [labels, setLabels] = useState<CustomLabels>(DEFAULT_LABELS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canManage = currentCompany ? isAdmin(currentCompany) : false

  useEffect(() => {
    if (currentCompany) {
      loadLabels()
    }
  }, [currentCompany])

  const loadLabels = async () => {
    if (!currentCompany) return

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('companies')
        .select('custom_labels')
        .eq('id', currentCompany.id)
        .single()

      if (error) throw error

      if (data?.custom_labels) {
        // Merge mit Defaults
        setLabels({
          company: data.custom_labels.company || DEFAULT_LABELS.company,
          roles: {
            admin: data.custom_labels.roles?.admin || DEFAULT_LABELS.roles?.admin,
            gl: data.custom_labels.roles?.gl || DEFAULT_LABELS.roles?.gl,
            superuser: data.custom_labels.roles?.superuser || DEFAULT_LABELS.roles?.superuser,
            user: data.custom_labels.roles?.user || DEFAULT_LABELS.roles?.user,
          },
        })
      }
    } catch (err) {
      console.error('Error loading labels:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentCompany || !canManage) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await supabase
        .from('companies')
        .update({ custom_labels: labels })
        .eq('id', currentCompany.id)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

      // Update current company in store
      if (currentCompany) {
        setCurrentCompany({
          ...currentCompany,
          custom_labels: labels,
        } as any)
      }
    } catch (err: any) {
      console.error('Error saving labels:', err)
      setError(err.message || 'Fehler beim Speichern der Bezeichnungen')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setLabels(DEFAULT_LABELS)
  }

  if (!currentCompany) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade...</p>
        </div>
      </div>
    )
  }

  if (!canManage) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-6 py-4 rounded-lg">
          <p className="font-medium">Keine Berechtigung</p>
          <p className="text-sm mt-1">Nur Administratoren können die Bezeichnungen ändern.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Bezeichnungen anpassen
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Passen Sie die Bezeichnungen für Firma und Rollen an Ihre Bedürfnisse an.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Bezeichnungen erfolgreich gespeichert!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Einstellungen...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Firmenbezeichnung */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Firmenbezeichnung
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Wie soll "Firma" in der Anwendung genannt werden? (z.B. "Unternehmen", "Organisation", "Team")
            </p>
            <div>
              <label htmlFor="companyLabel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bezeichnung
              </label>
              <input
                id="companyLabel"
                type="text"
                value={labels.company || ''}
                onChange={(e) => setLabels({ ...labels, company: e.target.value })}
                placeholder="Firma"
                className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Rollenbezeichnungen */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Rollenbezeichnungen
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Passen Sie die Namen der Benutzerrollen an (z.B. "Mitarbeiter" statt "Benutzer").
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="adminLabel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Administrator
                </label>
                <input
                  id="adminLabel"
                  type="text"
                  value={labels.roles?.admin || ''}
                  onChange={(e) => setLabels({
                    ...labels,
                    roles: { ...labels.roles, admin: e.target.value }
                  })}
                  placeholder="Administrator"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Voller Zugriff auf alle Einstellungen
                </p>
              </div>
              <div>
                <label htmlFor="glLabel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Geschäftsleitung
                </label>
                <input
                  id="glLabel"
                  type="text"
                  value={labels.roles?.gl || ''}
                  onChange={(e) => setLabels({
                    ...labels,
                    roles: { ...labels.roles, gl: e.target.value }
                  })}
                  placeholder="Geschäftsleitung"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Kann alle ToDos sehen und Mitglieder verwalten
                </p>
              </div>
              <div>
                <label htmlFor="superuserLabel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Superuser
                </label>
                <input
                  id="superuserLabel"
                  type="text"
                  value={labels.roles?.superuser || ''}
                  onChange={(e) => setLabels({
                    ...labels,
                    roles: { ...labels.roles, superuser: e.target.value }
                  })}
                  placeholder="Superuser"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Erweiterte Rechte nach Konfiguration
                </p>
              </div>
              <div>
                <label htmlFor="userLabel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Benutzer
                </label>
                <input
                  id="userLabel"
                  type="text"
                  value={labels.roles?.user || ''}
                  onChange={(e) => setLabels({
                    ...labels,
                    roles: { ...labels.roles, user: e.target.value }
                  })}
                  placeholder="Benutzer"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Standard-Rolle für normale Mitarbeiter
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Vorschau
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Firmenbegriff:</span> "{labels.company || 'Firma'}"
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                  {labels.roles?.admin || 'Administrator'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                  {labels.roles?.gl || 'Geschäftsleitung'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200">
                  {labels.roles?.superuser || 'Superuser'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  {labels.roles?.user || 'Benutzer'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Speichern
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              Auf Standard zurücksetzen
            </button>
          </div>

          {/* Info */}
          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-teal-900 dark:text-teal-200 mb-1">
                  Hinweis
                </h4>
                <p className="text-sm text-teal-800 dark:text-teal-300">
                  Die Änderungen werden sofort in der gesamten Anwendung übernommen.
                  Alle Mitglieder sehen die neuen Bezeichnungen bei der nächsten Seitenaktualisierung.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
