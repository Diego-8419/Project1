'use client'

/**
 * UserPicker Component
 * Modal zum Auswählen von Benutzern (für Assignees)
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCompanyMembers, type CompanyMember } from '@/lib/db/companies'

interface UserPickerProps {
  companyId: string
  selectedUserIds: string[]
  onClose: () => void
  onSave: (selectedUserIds: string[]) => void
  title?: string
}

export default function UserPicker({
  companyId,
  selectedUserIds,
  onClose,
  onSave,
  title = 'Benutzer zuweisen',
}: UserPickerProps) {
  const supabase = createClient()
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(selectedUserIds))
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadMembers()
  }, [companyId])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const membersData = await getCompanyMembers(supabase, companyId)
      setMembers(membersData)
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUser = (userId: string) => {
    const newSelectedIds = new Set(selectedIds)
    if (newSelectedIds.has(userId)) {
      newSelectedIds.delete(userId)
    } else {
      newSelectedIds.add(userId)
    }
    setSelectedIds(newSelectedIds)
  }

  const handleSave = () => {
    onSave(Array.from(selectedIds))
    onClose()
  }

  // Filter members based on search query
  const filteredMembers = members.filter(member => {
    const searchLower = searchQuery.toLowerCase()
    const name = (member.full_name || '').toLowerCase()
    const email = member.email.toLowerCase()
    return name.includes(searchLower) || email.includes(searchLower)
  })

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Name oder E-Mail..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>

          {/* Member List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : filteredMembers.length === 0 ? (
              <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Keine Benutzer gefunden' : 'Keine Mitglieder vorhanden'}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredMembers.map((member) => {
                  const isSelected = selectedIds.has(member.user_id)
                  return (
                    <button
                      key={member.user_id}
                      onClick={() => toggleUser(member.user_id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        isSelected ? 'bg-blue-600' : 'bg-gray-600'
                      }`}>
                        {(member.full_name || member.email).charAt(0).toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {member.full_name || member.email}
                        </div>
                        {member.full_name && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {member.email}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {member.role === 'admin' ? 'Administrator' : member.role === 'gl' ? 'Geschäftsleitung' : member.role === 'superuser' ? 'Superuser' : 'Benutzer'}
                        </div>
                      </div>

                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedIds.size} {selectedIds.size === 1 ? 'Benutzer' : 'Benutzer'} ausgewählt
              </span>
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Alle abwählen
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Zuweisen
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
