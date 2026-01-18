'use client'

/**
 * TodoItem Component
 * Einzelnes ToDo mit Status, Priorität, Assignees
 */

import { useState } from 'react'
import Link from 'next/link'
import { type TodoWithDetails } from '@/lib/db/todos'
import { createClient } from '@/lib/supabase/client'
import { updateTodo, deleteTodo, updateTodoStatus, archiveTodo, unarchiveTodo } from '@/lib/db/todos'
import { useAuthStore } from '@/lib/stores/authStore'
import { useCompanyStore } from '@/lib/stores/companyStore'
import { canChangeStatus, canDeleteTodo, canEditTodo } from '@/lib/utils/permissions'
import StatusChangeModal from './StatusChangeModal'

interface TodoItemProps {
  todo: TodoWithDetails
  onTodoUpdated: () => void
  onTodoDeleted: () => void
  companySlug: string
}

export default function TodoItem({ todo, onTodoUpdated, onTodoDeleted, companySlug }: TodoItemProps) {
  const supabase = createClient()
  const { user } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const [showMenu, setShowMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Berechtigungsprüfungen
  const canChangeStatusPermission = user ? canChangeStatus(todo, user.id, currentCompany) : false
  const canDeletePermission = user ? canDeleteTodo(todo, user.id, currentCompany) : false
  const canEditPermission = user ? canEditTodo(todo, user.id, currentCompany) : false

  const statusLabels = {
    open: 'Offen',
    in_progress: 'In Bearbeitung',
    question: 'Rückfrage',
    done: 'Erledigt',
  }

  const statusColors = {
    open: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    question: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    done: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  }

  const priorityLabels = {
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
    urgent: 'Dringend',
  }

  const priorityColors = {
    low: 'text-gray-600 dark:text-gray-400',
    medium: 'text-blue-600 dark:text-blue-400',
    high: 'text-orange-600 dark:text-orange-400',
    urgent: 'text-red-600 dark:text-red-400',
  }

  const handleStatusChange = async (newStatus: 'open' | 'in_progress' | 'question' | 'done', note?: string) => {
    if (!canChangeStatusPermission) {
      alert('Sie haben keine Berechtigung, den Status zu ändern.')
      return
    }

    try {
      setUpdating(true)
      setShowStatusMenu(false)
      await updateTodoStatus(supabase, todo.id, newStatus, note, user?.id)
      onTodoUpdated()
    } catch (error: any) {
      console.error('Error updating status:', error)
      const errorMessage = error?.message || error?.error_description || 'Fehler beim Aktualisieren'
      alert('Fehler beim Aktualisieren des Status: ' + errorMessage)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    // Berechtigungsprüfung
    if (!canDeletePermission) {
      alert('Sie haben keine Berechtigung, dieses ToDo zu löschen.')
      return
    }

    if (!confirm('Möchten Sie dieses ToDo wirklich löschen?')) return

    try {
      await deleteTodo(supabase, todo.id)
      onTodoDeleted()
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  const handleArchive = async () => {
    // Nur Admin oder Ersteller können archivieren
    const isCreator = user?.id === todo.created_by
    const isAdmin = currentCompany?.role === 'admin'

    if (!isAdmin && !isCreator) {
      alert('Sie haben keine Berechtigung, dieses ToDo zu archivieren.')
      return
    }

    try {
      setUpdating(true)
      if (todo.archived) {
        await unarchiveTodo(supabase, todo.id)
      } else {
        await archiveTodo(supabase, todo.id)
      }
      onTodoUpdated()
    } catch (error) {
      console.error('Error archiving todo:', error)
      alert('Fehler beim Archivieren')
    } finally {
      setUpdating(false)
    }
  }

  // Formatiere Datum
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const completedSubtasks = todo.subtasks.filter(s => s.status === 'done').length
  const totalSubtasks = todo.subtasks.length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <Link
            href={`/${companySlug}/todos/${todo.id}`}
            className="block text-base sm:text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition truncate mb-2"
          >
            {todo.title}
          </Link>

          {/* Badges Row - Mobile optimized */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {/* Priority Badge */}
            <span className={`inline-flex items-center gap-1 text-xs sm:text-sm font-medium ${priorityColors[todo.priority]}`}>
              {todo.priority === 'urgent' && '🔥'}
              {todo.priority === 'high' && '⚠️'}
              {priorityLabels[todo.priority]}
            </span>

            {/* Archiv Badge */}
            {todo.archived && (
              <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full inline-flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archiviert
              </span>
            )}
          </div>

          {/* Description */}
          {todo.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              {todo.description}
            </p>
          )}

          {/* Meta Info - Mobile optimized grid */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {/* Status Button - Opens Modal */}
            <button
              onClick={() => canChangeStatusPermission && setShowStatusModal(true)}
              disabled={updating || !canChangeStatusPermission}
              className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 transition ${
                canChangeStatusPermission && !updating ? 'hover:opacity-80 cursor-pointer' : 'opacity-50 cursor-not-allowed'
              } ${statusColors[todo.status]}`}
              title={!canChangeStatusPermission ? 'Keine Berechtigung zum Ändern des Status' : 'Status ändern'}
            >
              {statusLabels[todo.status]}
              {canChangeStatusPermission && (
                <svg className="w-3 h-3 hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )}
            </button>

            {/* Due Date */}
            {todo.deadline && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="whitespace-nowrap">{formatDate(todo.deadline)}</span>
              </span>
            )}

            {/* Subtasks Progress */}
            {totalSubtasks > 0 && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {completedSubtasks}/{totalSubtasks}
              </span>
            )}
          </div>

          {/* Created By - Separate row on mobile */}
          <div className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="truncate max-w-[150px] sm:max-w-none">{todo.created_by_user.full_name || todo.created_by_user.email}</span>
            </span>
          </div>

          {/* Assignees */}
          {todo.assignees.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Zugewiesen:</span>
              <div className="flex -space-x-2">
                {todo.assignees.slice(0, 3).map((assignee) => {
                  const name = assignee.full_name || assignee.user_email
                  const initials = name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2)
                  return (
                    <div
                      key={assignee.user_id}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-[10px] sm:text-xs font-medium"
                      title={name}
                    >
                      {initials}
                    </div>
                  )
                })}
                {todo.assignees.length > 3 && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-400 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-[10px] sm:text-xs font-medium">
                    +{todo.assignees.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions - Compact on mobile */}
        <div className="flex gap-1 sm:gap-2 shrink-0">
          {/* Archive Button (Admin or Creator) */}
          {(currentCompany?.role === 'admin' || user?.id === todo.created_by) && (
            <button
              onClick={handleArchive}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              disabled={updating}
              title={todo.archived ? 'Wiederherstellen' : 'Archivieren'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>
          )}

          {/* Delete Button (only show if user can delete) */}
          {canDeletePermission && (
            <button
              onClick={handleDelete}
              className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
              disabled={updating}
              title="ToDo löschen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
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
    </div>
  )
}
