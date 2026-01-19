'use client'

/**
 * ToDo Detail-Ansicht
 * Zeigt alle Details eines ToDos mit Bearbeitungsfunktionen
 */

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getTodoById, updateTodo, updateTodoStatus, getTodoActivities, archiveTodo, unarchiveTodo, createSubtask, updateSubtask, deleteSubtask, addTodoAssignees, removeTodoAssignees, type TodoWithDetails } from '@/lib/db/todos'
import { getTodoDocuments, linkDocumentToTodo, unlinkDocumentFromTodo, getDocumentDownloadUrl, type DocumentWithUploader } from '@/lib/db/documents'
import { useAuthStore } from '@/lib/stores/authStore'
import { useCompanyStore } from '@/lib/stores/companyStore'
import { canEditTodo, canDeleteTodo } from '@/lib/utils/permissions'
import StatusChangeModal from '@/components/todos/StatusChangeModal'
import ActivityTimeline from '@/components/todos/ActivityTimeline'
import SubtaskModal from '@/components/todos/SubtaskModal'
import UserPicker from '@/components/shared/UserPicker'
import DocumentPicker from '@/components/documents/DocumentPicker'
import DocumentUpload from '@/components/documents/DocumentUpload'
import { uploadDocument } from '@/lib/db/documents'

export default function TodoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const { user } = useAuthStore()
  const { currentCompany } = useCompanyStore()

  const todoId = params.todoId as string
  const companySlug = params.companySlug as string

  const [todo, setTodo] = useState<TodoWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit states
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [saving, setSaving] = useState(false)

  // Status change modal
  const [showStatusModal, setShowStatusModal] = useState(false)

  // Activity timeline
  const [activities, setActivities] = useState<any[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)

  // Subtask modal
  const [showSubtaskModal, setShowSubtaskModal] = useState(false)
  const [editingSubtask, setEditingSubtask] = useState<any>(null)

  // User picker modal
  const [showUserPicker, setShowUserPicker] = useState(false)

  // Documents
  const [documents, setDocuments] = useState<DocumentWithUploader[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [showDocumentPicker, setShowDocumentPicker] = useState(false)
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)

  useEffect(() => {
    loadTodo()
  }, [todoId])

  const loadTodo = async () => {
    try {
      setLoading(true)
      const todoData = await getTodoById(supabase, todoId)

      if (!todoData) {
        setError('ToDo nicht gefunden')
        return
      }

      setTodo(todoData)
      setEditTitle(todoData.title)
      setEditDescription(todoData.description || '')
      const deadline = todoData.deadline
        ? new Date(todoData.deadline).toISOString().slice(0, 16)
        : ''
      setEditDeadline(deadline)
      setEditPriority(todoData.priority as 'low' | 'medium' | 'high' | 'urgent')

      // Lade Aktivitäten und Dokumente
      loadActivities()
      loadDocuments()
    } catch (err: any) {
      console.error('Error loading todo:', err)
      setError('Fehler beim Laden des ToDos')
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async () => {
    try {
      setLoadingActivities(true)
      const activitiesData = await getTodoActivities(supabase, todoId)
      setActivities(activitiesData)
    } catch (err: any) {
      console.error('Error loading activities:', err)
    } finally {
      setLoadingActivities(false)
    }
  }

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true)
      const documentsData = await getTodoDocuments(supabase, todoId)
      setDocuments(documentsData)
    } catch (err: any) {
      console.error('Error loading documents:', err)
    } finally {
      setLoadingDocuments(false)
    }
  }

  const handleSaveTitle = async () => {
    if (!todo || !user || !currentCompany) return
    if (!canEditTodo(todo, user.id, currentCompany)) {
      alert('Keine Berechtigung zum Bearbeiten')
      return
    }

    try {
      setSaving(true)
      await updateTodo(supabase, todo.id, { title: editTitle })
      await loadTodo()
      setEditingTitle(false)
    } catch (err: any) {
      console.error('Error saving title:', err)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDescription = async () => {
    if (!todo || !user || !currentCompany) return
    if (!canEditTodo(todo, user.id, currentCompany)) {
      alert('Keine Berechtigung zum Bearbeiten')
      return
    }

    try {
      setSaving(true)
      await updateTodo(supabase, todo.id, { description: editDescription })
      await loadTodo()
      setEditingDescription(false)
    } catch (err: any) {
      console.error('Error saving description:', err)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDeadline = async () => {
    if (!todo || !user || !currentCompany) return
    if (!canEditTodo(todo, user.id, currentCompany)) {
      alert('Keine Berechtigung zum Bearbeiten')
      return
    }

    try {
      setSaving(true)
      await updateTodo(supabase, todo.id, { deadline: editDeadline || null })
      await loadTodo()
    } catch (err: any) {
      console.error('Error saving deadline:', err)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePriority = async () => {
    if (!todo || !user || !currentCompany) return
    if (!canEditTodo(todo, user.id, currentCompany)) {
      alert('Keine Berechtigung zum Bearbeiten')
      return
    }

    try {
      setSaving(true)
      await updateTodo(supabase, todo.id, { priority: editPriority })
      await loadTodo()
    } catch (err: any) {
      console.error('Error saving priority:', err)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: 'open' | 'in_progress' | 'question' | 'done', note?: string) => {
    if (!todo || !user || !currentCompany) return
    if (!canEditTodo(todo, user.id, currentCompany)) {
      alert('Keine Berechtigung zum Bearbeiten')
      return
    }

    try {
      setSaving(true)
      await updateTodoStatus(supabase, todo.id, newStatus, note, user?.id)
      await loadTodo()
    } catch (err: any) {
      console.error('Error saving status:', err)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleArchiveToggle = async () => {
    if (!todo || !user || !currentCompany) return
    if (!canEditTodo(todo, user.id, currentCompany)) {
      alert('Keine Berechtigung zum Bearbeiten')
      return
    }

    const action = todo.archived ? 'entarchivieren' : 'archivieren'
    if (!confirm(`Möchten Sie dieses ToDo wirklich ${action}?`)) return

    try {
      setSaving(true)
      if (todo.archived) {
        await unarchiveTodo(supabase, todo.id)
      } else {
        await archiveTodo(supabase, todo.id)
      }
      await loadTodo()
    } catch (err: any) {
      console.error('Error toggling archive:', err)
      alert('Fehler beim Archivieren')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSubtask = () => {
    setEditingSubtask(null)
    setShowSubtaskModal(true)
  }

  const handleEditSubtask = (subtask: any) => {
    setEditingSubtask(subtask)
    setShowSubtaskModal(true)
  }

  const handleSaveSubtask = async (data: {
    title: string
    description: string
    status: 'open' | 'in_progress' | 'question' | 'done'
  }) => {
    if (!todo || !user) return

    try {
      if (editingSubtask) {
        // Update existing subtask
        await updateSubtask(supabase, editingSubtask.id, data)
      } else {
        // Create new subtask
        await createSubtask(supabase, {
          todoId: todo.id,
          userId: user.id,
          title: data.title,
          description: data.description || undefined,
        })
      }
      await loadTodo()
    } catch (error) {
      console.error('Error saving subtask:', error)
      throw error
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!confirm('Möchten Sie diesen Subtask wirklich löschen?')) return

    try {
      setSaving(true)
      await deleteSubtask(supabase, subtaskId)
      await loadTodo()
    } catch (err: any) {
      console.error('Error deleting subtask:', err)
      alert('Fehler beim Löschen')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAssignees = async (selectedUserIds: string[]) => {
    if (!todo) return

    try {
      setSaving(true)
      const currentAssigneeIds = todo.assignees.map(a => a.user_id)

      // Find users to add and remove
      const toAdd = selectedUserIds.filter(id => !currentAssigneeIds.includes(id))
      const toRemove = currentAssigneeIds.filter(id => !selectedUserIds.includes(id))

      // Add new assignees
      if (toAdd.length > 0) {
        await addTodoAssignees(supabase, todo.id, toAdd)
      }

      // Remove assignees
      if (toRemove.length > 0) {
        await removeTodoAssignees(supabase, todo.id, toRemove)
      }

      await loadTodo()
    } catch (err: any) {
      console.error('Error updating assignees:', err)
      alert('Fehler beim Aktualisieren der Zuweisungen')
    } finally {
      setSaving(false)
    }
  }

  const handleLinkDocument = async (documentId: string) => {
    if (!todo) return

    try {
      setSaving(true)
      await linkDocumentToTodo(supabase, todo.id, documentId)
      await loadDocuments()
    } catch (err: any) {
      console.error('Error linking document:', err)
      alert('Fehler beim Verknüpfen des Dokuments')
    } finally {
      setSaving(false)
    }
  }

  const handleUnlinkDocument = async (documentId: string) => {
    if (!todo) return
    if (!confirm('Möchten Sie die Verknüpfung wirklich entfernen?')) return

    try {
      setSaving(true)
      await unlinkDocumentFromTodo(supabase, todo.id, documentId)
      await loadDocuments()
    } catch (err: any) {
      console.error('Error unlinking document:', err)
      alert('Fehler beim Entfernen der Verknüpfung')
    } finally {
      setSaving(false)
    }
  }

  const handleUploadDocument = async (file: File, description: string) => {
    if (!todo || !currentCompany || !user) return

    try {
      // 1. Lade Dokument hoch (in die Dokumente-Bibliothek der Firma)
      const document = await uploadDocument(supabase, {
        companyId: currentCompany.id,
        userId: user.id,
        file,
        description,
      })

      // 2. Verknüpfe mit dem ToDo
      await linkDocumentToTodo(supabase, todo.id, document.id)

      // 3. Lade Dokumente neu
      await loadDocuments()
    } catch (err: any) {
      console.error('Error uploading document:', err)
      throw new Error(err.message || 'Fehler beim Hochladen des Dokuments')
    }
  }

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      const url = await getDocumentDownloadUrl(supabase, filePath)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Fehler beim Herunterladen des Dokuments')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    } else if (mimeType === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    } else {
      return (
        <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error || !todo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            {error || 'ToDo nicht gefunden'}
          </div>
          <Link
            href={`/${companySlug}/todos`}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Zurück zur Liste
          </Link>
        </div>
      </div>
    )
  }

  const canEdit = user && currentCompany && canEditTodo(todo, user.id, currentCompany)
  const canDelete = user && currentCompany && canDeleteTodo(todo, user.id, currentCompany)

  const statusLabels = {
    open: 'Offen',
    in_progress: 'In Bearbeitung',
    question: 'Rückfrage',
    done: 'Erledigt',
  }

  const priorityLabels = {
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
    urgent: 'Dringend',
  }

  const priorityColors = {
    low: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    medium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
    urgent: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  }

  const statusColors = {
    open: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    question: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    done: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/${companySlug}/todos`}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-2"
          >
            <span>←</span>
            <span>Zurück zur Liste</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Archiv-Badge wenn archiviert */}
            {todo.archived && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archiviert
              </span>
            )}

            {/* Archivieren/Entarchivieren Button */}
            {canEdit && (
              <button
                className={`px-4 py-2 ${
                  todo.archived
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                } text-white rounded-lg transition flex items-center gap-2`}
                onClick={handleArchiveToggle}
                disabled={saving}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                {todo.archived ? 'Entarchivieren' : 'Archivieren'}
              </button>
            )}

            {/* Löschen Button */}
            {canDelete && (
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                onClick={() => {
                  if (confirm('Dieses ToDo wirklich löschen?')) {
                    // TODO: Implement delete
                    alert('Löschen noch nicht implementiert')
                  }
                }}
              >
                Löschen
              </button>
            )}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
          {/* Title */}
          <div className="mb-6">
            {editingTitle ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveTitle}
                    disabled={saving || !editTitle.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {saving ? 'Speichert...' : 'Speichern'}
                  </button>
                  <button
                    onClick={() => {
                      setEditTitle(todo.title)
                      setEditingTitle(false)
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {todo.title}
                </h1>
                {canEdit && (
                  <button
                    onClick={() => setEditingTitle(true)}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Bearbeiten
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              {canEdit ? (
                <button
                  onClick={() => setShowStatusModal(true)}
                  disabled={saving}
                  className={`w-full px-3 py-2 rounded-lg text-left font-medium transition hover:opacity-80 ${statusColors[todo.status]}`}
                >
                  {statusLabels[todo.status]}
                </button>
              ) : (
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[todo.status]}`}>
                  {statusLabels[todo.status]}
                </span>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priorität
              </label>
              {canEdit ? (
                <select
                  value={editPriority}
                  onChange={(e) => {
                    setEditPriority(e.target.value as any)
                    // Auto-save on change
                    setTimeout(() => {
                      if (e.target.value !== todo.priority) {
                        handleSavePriority()
                      }
                    }, 0)
                  }}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                  <option value="urgent">Dringend</option>
                </select>
              ) : (
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${priorityColors[todo.priority as keyof typeof priorityColors]}`}>
                  {priorityLabels[todo.priority as keyof typeof priorityLabels]}
                </span>
              )}
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deadline
              </label>
              {canEdit ? (
                <input
                  type="datetime-local"
                  value={editDeadline}
                  onChange={(e) => {
                    setEditDeadline(e.target.value)
                    // Auto-save on blur
                  }}
                  onBlur={() => {
                    if (editDeadline !== (todo.deadline || '')) {
                      handleSaveDeadline()
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">
                  {todo.deadline
                    ? new Date(todo.deadline).toLocaleString('de-DE')
                    : 'Keine Deadline'}
                </p>
              )}
            </div>

            {/* Creator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Erstellt von
              </label>
              <p className="text-gray-900 dark:text-white">
                {todo.created_by_user.full_name || todo.created_by_user.email}
              </p>
            </div>
          </div>

          {/* Assignees */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Zugewiesen an
              </label>
              {canEdit && (
                <button
                  onClick={() => setShowUserPicker(true)}
                  disabled={saving}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Verwalten
                </button>
              )}
            </div>
            {todo.assignees.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {todo.assignees.map((assignee) => {
                  const name = assignee.full_name || assignee.user_email
                  const initials = name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2)
                  return (
                    <div
                      key={assignee.user_id}
                      className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                        {initials}
                      </div>
                      {name}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Keine Zuweisungen
              </p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Beschreibung
              </label>
              {canEdit && !editingDescription && (
                <button
                  onClick={() => setEditingDescription(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Bearbeiten
                </button>
              )}
            </div>

            {editingDescription ? (
              <div className="space-y-3">
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Beschreibung hinzufügen..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDescription}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {saving ? 'Speichert...' : 'Speichern'}
                  </button>
                  <button
                    onClick={() => {
                      setEditDescription(todo.description || '')
                      setEditingDescription(false)
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none">
                {todo.description ? (
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {todo.description}
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    Keine Beschreibung vorhanden
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Verknüpfte Dokumente ({documents.length})
              </h3>
              {canEdit && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDocumentUpload(true)}
                    className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Hochladen
                  </button>
                  <button
                    onClick={() => setShowDocumentPicker(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Verknüpfen
                  </button>
                </div>
              )}
            </div>

            {loadingDocuments ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center gap-4"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getFileIcon(doc.mime_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {doc.name}
                      </h4>
                      {doc.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>von {doc.uploader?.full_name || 'Unbekannt'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadDocument(doc.file_path, doc.name)}
                        className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Herunterladen"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleUnlinkDocument(doc.id)}
                          className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Verknüpfung entfernen"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Keine Dokumente verknüpft
              </p>
            )}
          </div>

          {/* Subtasks Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Subtasks ({todo.subtasks.length})
              </h3>
              {canEdit && (
                <button
                  onClick={handleAddSubtask}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Neuer Subtask
                </button>
              )}
            </div>

            {todo.subtasks.length > 0 ? (
              <div className="space-y-2">
                {todo.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {subtask.title}
                        </h4>
                        {subtask.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {subtask.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[subtask.status]}`}>
                            {statusLabels[subtask.status]}
                          </span>
                          {subtask.assignees.length > 0 && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              → {subtask.assignees.map(a => a.full_name || a.user_email).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditSubtask(subtask)}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDeleteSubtask(subtask.id)}
                            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            Löschen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Keine Subtasks vorhanden
              </p>
            )}
          </div>

          {/* Comments Section - Placeholder */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Kommentare
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm italic">
              Kommentar-Funktion wird in Phase 3 implementiert
            </p>
          </div>

          {/* Activity Timeline */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            {loadingActivities ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <ActivityTimeline activities={activities} />
            )}
          </div>
        </div>

        {/* Status Change Modal */}
        {showStatusModal && (
          <StatusChangeModal
            currentStatus={todo.status}
            onClose={() => setShowStatusModal(false)}
            onSave={handleStatusChange}
          />
        )}

        {/* Subtask Modal */}
        {showSubtaskModal && (
          <SubtaskModal
            todoId={todo.id}
            subtask={editingSubtask}
            onClose={() => {
              setShowSubtaskModal(false)
              setEditingSubtask(null)
            }}
            onSave={handleSaveSubtask}
          />
        )}

        {/* User Picker Modal */}
        {showUserPicker && currentCompany && (
          <UserPicker
            companyId={currentCompany.id}
            selectedUserIds={todo.assignees.map(a => a.user_id)}
            onClose={() => setShowUserPicker(false)}
            onSave={handleSaveAssignees}
            title="Benutzer zuweisen"
          />
        )}

        {/* Document Picker Modal */}
        {showDocumentPicker && (
          <DocumentPicker
            onClose={() => setShowDocumentPicker(false)}
            onSelect={handleLinkDocument}
            excludeIds={documents.map(d => d.id)}
          />
        )}

        {showDocumentUpload && (
          <DocumentUpload
            onClose={() => setShowDocumentUpload(false)}
            onUpload={handleUploadDocument}
          />
        )}
      </div>
    </div>
  )
}
