'use client'

/**
 * CreateTodoModal Component
 * Modal zum Erstellen neuer ToDos mit Zuweisungen
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createTodo } from '@/lib/db/todos'
import { getCompanyMembers, type CompanyMember } from '@/lib/db/companies'
import { useAuthStore } from '@/lib/stores/authStore'

interface CreateTodoModalProps {
  companyId: string
  onClose: () => void
  onTodoCreated: () => void
}

export default function CreateTodoModal({ companyId, onClose, onTodoCreated }: CreateTodoModalProps) {
  const supabase = createClient()
  const { user } = useAuthStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [dueDate, setDueDate] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      const companyMembers = await getCompanyMembers(supabase, companyId)
      setMembers(companyMembers)
    } catch (error) {
      console.error('Error loading members:', error)
      setError('Fehler beim Laden der Mitglieder: ' + (error as Error).message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setCreating(true)
    setError(null)

    try {
      await createTodo(supabase, {
        companyId,
        userId: user.id,
        title,
        description,
        priority,
        deadline: dueDate || undefined,
        assigneeIds: selectedAssignees.length > 0 ? selectedAssignees : undefined,
      })

      onTodoCreated()
    } catch (err: any) {
      console.error('Error creating todo:', err)
      setError(err.message || 'Fehler beim Erstellen des ToDos')
    } finally {
      setCreating(false)
    }
  }

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Neues ToDo erstellen
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titel *
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Neue Feature implementieren"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Beschreibung
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional: Detaillierte Beschreibung des ToDos"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Priority & Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priorität
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                  <option value="urgent">Dringend 🔥</option>
                </select>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fälligkeitsdatum
                </label>
                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Assignees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zuweisen an
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                {members.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Lade Mitglieder...</p>
                ) : (
                  members.map((member) => (
                    <label
                      key={member.user_id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAssignees.includes(member.user_id)}
                        onChange={() => toggleAssignee(member.user_id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.full_name || member.email}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {member.role === 'admin' ? 'Administrator' : member.role === 'gl' ? 'Geschäftsleitung' : 'Benutzer'}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {selectedAssignees.length} Mitglied(er) ausgewählt
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating || !title.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Wird erstellt...' : 'ToDo erstellen'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
