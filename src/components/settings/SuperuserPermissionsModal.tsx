'use client'

/**
 * Superuser Permissions Modal
 * Modal zum Verwalten der Sichtbarkeitsrechte eines Superusers
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getSuperuserPermissions,
  addSuperuserPermission,
  removeSuperuserPermission,
  clearSuperuserPermissions,
  type SuperuserPermission
} from '@/lib/db/companies'

interface SuperuserPermissionsModalProps {
  superuserId: string
  superuserName: string
  onClose: () => void
  onSaved: () => void
}

export default function SuperuserPermissionsModal({
  superuserId,
  superuserName,
  onClose,
  onSaved
}: SuperuserPermissionsModalProps) {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissions, setPermissions] = useState<SuperuserPermission[]>([])

  // Alle verfügbaren Firmen und User
  const [allCompanies, setAllCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [allUsers, setAllUsers] = useState<Array<{ id: string; name: string; email: string }>>([])

  // Ausgewählte IDs
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set())
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Lade bestehende Permissions
      const existingPermissions = await getSuperuserPermissions(supabase, superuserId)
      setPermissions(existingPermissions)

      // Extrahiere bereits zugewiesene IDs
      const companyIds = new Set(
        existingPermissions
          .filter(p => p.company_id)
          .map(p => p.company_id!)
      )
      const userIds = new Set(
        existingPermissions
          .filter(p => p.target_user_id)
          .map(p => p.target_user_id!)
      )

      setSelectedCompanyIds(companyIds)
      setSelectedUserIds(userIds)

      // Lade alle Firmen
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')

      setAllCompanies(companies || [])

      // Lade alle User
      const { data: users } = await (supabase as any)
        .from('user_profiles')
        .select('user_id, full_name')
        .order('full_name')

      setAllUsers((users || []).map((u: any) => ({
        id: u.user_id,
        name: u.full_name || 'Unbekannt',
        email: u.user_id
      })))

    } catch (err: any) {
      console.error('Error loading data:', err)
      alert('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Lösche alle bestehenden Permissions
      await clearSuperuserPermissions(supabase, superuserId)

      // Füge neue Permissions hinzu
      for (const companyId of selectedCompanyIds) {
        await addSuperuserPermission(supabase, {
          superuserId,
          companyId
        })
      }

      for (const userId of selectedUserIds) {
        await addSuperuserPermission(supabase, {
          superuserId,
          targetUserId: userId
        })
      }

      onSaved()
      onClose()
    } catch (err: any) {
      console.error('Error saving permissions:', err)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const toggleCompany = (companyId: string) => {
    const newSet = new Set(selectedCompanyIds)
    if (newSet.has(companyId)) {
      newSet.delete(companyId)
    } else {
      newSet.add(companyId)
    }
    setSelectedCompanyIds(newSet)
  }

  const toggleUser = (userId: string) => {
    const newSet = new Set(selectedUserIds)
    if (newSet.has(userId)) {
      newSet.delete(userId)
    } else {
      newSet.add(userId)
    }
    setSelectedUserIds(newSet)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Superuser-Berechtigungen
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Verwalte Sichtbarkeit für: <strong>{superuserName}</strong>
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Lade Daten...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Firmen */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Sichtbare Firmen
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Wähle die Firmen aus, die der Superuser sehen kann
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allCompanies.map(company => (
                    <label
                      key={company.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCompanyIds.has(company.id)}
                        onChange={() => toggleCompany(company.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-900 dark:text-white font-medium">
                        {company.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* User */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Sichtbare Benutzer
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Wähle einzelne Benutzer aus, die der Superuser sehen kann
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allUsers.map(user => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-900 dark:text-white">
                        {user.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Speichert...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
