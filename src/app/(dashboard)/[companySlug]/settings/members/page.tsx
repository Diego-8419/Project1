'use client'

/**
 * Members Management Page
 * Admin/GL können Benutzer zur Firma hinzufügen und Rollen verwalten
 */

import { useEffect, useState } from 'react'
import { useCompanyStore } from '@/lib/stores/companyStore'
import { useAuthStore } from '@/lib/stores/authStore'
import { createClient } from '@/lib/supabase/client'
import { getCompanyMembers, addCompanyMemberByEmail, removeCompanyMember, updateMemberRole, type CompanyMember } from '@/lib/db/companies'
import { isAdminOrGL } from '@/lib/utils/permissions'
import SuperuserPermissionsModal from '@/components/settings/SuperuserPermissionsModal'

export default function MembersPage() {
  const supabase = createClient()
  const { currentCompany } = useCompanyStore()
  const { user } = useAuthStore()

  const [members, setMembers] = useState<CompanyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'gl' | 'superuser' | 'user'>('user')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuperuserModal, setShowSuperuserModal] = useState(false)
  const [selectedSuperuser, setSelectedSuperuser] = useState<{ id: string; name: string } | null>(null)

  const canManageMembers = currentCompany ? isAdminOrGL(currentCompany) : false

  useEffect(() => {
    if (currentCompany) {
      loadMembers()
    }
  }, [currentCompany])

  const loadMembers = async () => {
    if (!currentCompany) return

    try {
      setLoading(true)
      const data = await getCompanyMembers(supabase, currentCompany.id)
      setMembers(data)
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCompany || !canManageMembers) return

    setAdding(true)
    setError(null)

    try {
      await addCompanyMemberByEmail(supabase, {
        companyId: currentCompany.id,
        userEmail: newMemberEmail,
        role: newMemberRole,
      })

      setShowAddModal(false)
      setNewMemberEmail('')
      setNewMemberRole('user')
      loadMembers()
    } catch (err: any) {
      console.error('Error adding member:', err)
      setError(err.message || 'Fehler beim Hinzufügen des Mitglieds')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!currentCompany || !canManageMembers) return
    if (!confirm('Möchten Sie dieses Mitglied wirklich entfernen?')) return

    try {
      await removeCompanyMember(supabase, currentCompany.id, userId)
      loadMembers()
    } catch (err: any) {
      console.error('Error removing member:', err)
      alert('Fehler beim Entfernen des Mitglieds')
    }
  }

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'gl' | 'superuser' | 'user') => {
    if (!currentCompany || !canManageMembers) return

    try {
      await updateMemberRole(supabase, currentCompany.id, userId, newRole)

      // Wenn die neue Rolle Superuser ist, öffne das Permissions-Modal
      if (newRole === 'superuser') {
        const member = members.find(m => m.user_id === userId)
        if (member) {
          setSelectedSuperuser({
            id: userId,
            name: member.full_name || member.email
          })
          setShowSuperuserModal(true)
        }
      }

      loadMembers()
    } catch (err: any) {
      console.error('Error updating role:', err)
      alert('Fehler beim Aktualisieren der Rolle')
    }
  }

  const handleManageSuperuserPermissions = (userId: string, name: string) => {
    setSelectedSuperuser({ id: userId, name })
    setShowSuperuserModal(true)
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

  if (!canManageMembers) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-6 py-4 rounded-lg">
          <p className="font-medium">Keine Berechtigung</p>
          <p className="text-sm mt-1">Nur Administratoren und Geschäftsleitung können Mitglieder verwalten.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mitglieder
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentCompany.name} - {members.length} Mitglied(er)
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Mitglied hinzufügen
        </button>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Mitglieder...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name / E-Mail
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rolle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Beigetreten
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {members.map((member) => (
                <tr key={member.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                        {(member.full_name || member.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.full_name || 'Kein Name'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.user_id, e.target.value as any)}
                        disabled={member.user_id === user?.id}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[member.role]} ${
                          member.user_id === user?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <option value="admin">Administrator</option>
                        <option value="gl">Geschäftsleitung</option>
                        <option value="superuser">Superuser</option>
                        <option value="user">Benutzer</option>
                      </select>
                      {member.role === 'superuser' && (
                        <button
                          onClick={() => handleManageSuperuserPermissions(member.user_id, member.full_name || member.email)}
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Berechtigungen verwalten"
                        >
                          ⚙️
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(member.created_at).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {member.user_id !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        Entfernen
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowAddModal(false)}
          ></div>

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Mitglied hinzufügen
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddMember} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    E-Mail-Adresse
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="beispiel@email.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Der Benutzer muss bereits registriert sein.
                  </p>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rolle
                  </label>
                  <select
                    id="role"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="user">Benutzer</option>
                    <option value="gl">Geschäftsleitung</option>
                    <option value="superuser">Superuser</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Superuser: Kann manuell bestimmte Firmen und User sehen
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={adding || !newMemberEmail}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding ? 'Wird hinzugefügt...' : 'Hinzufügen'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
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

      {/* Superuser Permissions Modal */}
      {showSuperuserModal && selectedSuperuser && (
        <SuperuserPermissionsModal
          superuserId={selectedSuperuser.id}
          superuserName={selectedSuperuser.name}
          onClose={() => {
            setShowSuperuserModal(false)
            setSelectedSuperuser(null)
          }}
          onSaved={() => {
            loadMembers()
          }}
        />
      )}
    </div>
  )
}
