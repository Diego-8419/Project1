'use client'

/**
 * CreateTodoModal Component
 * Modal zum Erstellen neuer ToDos mit Zuweisungen und Dokumenten
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createTodo } from '@/lib/db/todos'
import { getCompanyMembers, type CompanyMember } from '@/lib/db/companies'
import { getCompanyDocuments, linkDocumentToTodo, type DocumentWithUploader } from '@/lib/db/documents'
import { useAuthStore } from '@/lib/stores/authStore'
import DocumentPicker from '@/components/documents/DocumentPicker'

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

  // Document states
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentWithUploader[]>([])
  const [allDocuments, setAllDocuments] = useState<DocumentWithUploader[]>([])
  const [showDocumentPicker, setShowDocumentPicker] = useState(false)

  useEffect(() => {
    loadMembers()
    loadDocuments()
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

  const loadDocuments = async () => {
    try {
      const documents = await getCompanyDocuments(supabase, companyId)
      setAllDocuments(documents)
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  const handleAddDocument = (documentId: string) => {
    const doc = allDocuments.find(d => d.id === documentId)
    if (doc && !selectedDocuments.find(d => d.id === documentId)) {
      setSelectedDocuments(prev => [...prev, doc])
    }
  }

  const handleRemoveDocument = (documentId: string) => {
    setSelectedDocuments(prev => prev.filter(d => d.id !== documentId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setCreating(true)
    setError(null)

    try {
      const todo = await createTodo(supabase, {
        companyId,
        userId: user.id,
        title,
        description,
        priority,
        deadline: dueDate || undefined,
        assigneeIds: selectedAssignees.length > 0 ? selectedAssignees : undefined,
      })

      // Verknüpfe ausgewählte Dokumente mit dem ToDo
      if (selectedDocuments.length > 0) {
        for (const doc of selectedDocuments) {
          try {
            await linkDocumentToTodo(supabase, todo.id, doc.id)
          } catch (linkError) {
            console.error('Error linking document:', linkError)
            // Fehler beim Verknüpfen ignorieren, ToDo wurde bereits erstellt
          }
        }
      }

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

            {/* Documents */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dokumente verknüpfen
                </label>
                <button
                  type="button"
                  onClick={() => setShowDocumentPicker(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Dokument hinzufügen
                </button>
              </div>

              {selectedDocuments.length > 0 ? (
                <div className="space-y-2 border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                  {selectedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(doc.file_size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 flex-shrink-0"
                        title="Entfernen"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Keine Dokumente ausgewählt
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Klicken Sie auf "Dokument hinzufügen" um Dokumente zu verknüpfen
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {selectedDocuments.length} Dokument(e) ausgewählt
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

      {/* Document Picker Modal */}
      {showDocumentPicker && (
        <DocumentPicker
          onClose={() => setShowDocumentPicker(false)}
          onSelect={(documentId) => {
            handleAddDocument(documentId)
            setShowDocumentPicker(false)
          }}
          excludeIds={selectedDocuments.map(d => d.id)}
        />
      )}
    </>
  )
}
