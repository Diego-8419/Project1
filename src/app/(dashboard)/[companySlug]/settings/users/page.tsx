'use client'

/**
 * User Management Page (Admin only)
 * Allows admins to view and edit user data
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { useCompanyStore } from '@/lib/stores/companyStore'

interface CompanyMember {
  id: string
  user_id: string
  company_id: string
  role: 'admin' | 'gl' | 'user'
  user_profiles: {
    email: string
    full_name: string | null
  }
}

export default function UserManagementPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()
  const { currentCompany } = useCompanyStore()

  const [members, setMembers] = useState<CompanyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ full_name: '', role: '' })

  useEffect(() => {
    loadMembers()
  }, [currentCompany])

  const loadMembers = async () => {
    if (!currentCompany) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('company_members')
        .select(`
          *,
          user_profiles (email, full_name)
        `)
        .eq('company_id', currentCompany.id)

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = members.find(m => m.user_id === user?.id)?.role === 'admin'

  const handleEditClick = (member: CompanyMember) => {
    setEditingUser(member.user_id)
    setEditForm({
      full_name: member.user_profiles.full_name || '',
      role: member.role,
    })
  }

  const handleSave = async (userId: string) => {
    try {
      // Update user profile
      const { error: profileError } = await (supabase as any)
        .from('user_profiles')
        .update({ full_name: editForm.full_name })
        .eq('id', userId)

      if (profileError) throw profileError

      // Update role
      const { error: roleError } = await (supabase as any)
        .from('company_members')
        .update({ role: editForm.role as 'admin' | 'gl' | 'user' })
        .eq('user_id', userId)
        .eq('company_id', currentCompany?.id)

      if (roleError) throw roleError

      setEditingUser(null)
      await loadMembers()
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Fehler beim Aktualisieren der Benutzerdaten')
    }
  }

  const handleCancel = () => {
    setEditingUser(null)
    setEditForm({ full_name: '', role: '' })
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
            Keine Berechtigung
          </h2>
          <p className="text-red-700 dark:text-red-300">
            Sie benötigen Administrator-Rechte, um auf diese Seite zuzugreifen.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Benutzerverwaltung
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Benutzer bearbeiten und Rollen verwalten
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                E-Mail
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rolle
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="px-6 py-4">
                  {editingUser === member.user_id ? (
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <span className="text-gray-900 dark:text-white font-medium">
                      {member.user_profiles.full_name || 'Kein Name'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-600 dark:text-gray-400">
                    {member.user_profiles.email}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {editingUser === member.user_id ? (
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="user">Benutzer</option>
                      <option value="gl">Geschäftsleitung</option>
                      <option value="admin">Administrator</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.role === 'admin'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                        : member.role === 'gl'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {member.role === 'admin' ? 'Administrator' : member.role === 'gl' ? 'Geschäftsleitung' : 'Benutzer'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {editingUser === member.user_id ? (
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleSave(member.user_id)}
                        className="px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition"
                      >
                        Speichern
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditClick(member)}
                      disabled={member.user_id === user?.id}
                      className="px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title={member.user_id === user?.id ? 'Sie können sich nicht selbst bearbeiten' : 'Benutzer bearbeiten'}
                    >
                      Bearbeiten
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
