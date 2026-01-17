'use client'

/**
 * Board Component
 * Drag & Drop Board für ToDos nach Status
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCompanyTodos, updateTodoStatus, type TodoWithDetails } from '@/lib/db/todos'
import { useAuthStore } from '@/lib/stores/authStore'
import { useCompanyStore } from '@/lib/stores/companyStore'
import { useRouter } from 'next/navigation'

interface KanbanBoardProps {
  companySlug: string
}

export default function KanbanBoard({ companySlug }: KanbanBoardProps) {
  const supabase = createClient()
  const { user } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const router = useRouter()

  const [todos, setTodos] = useState<TodoWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedTodo, setDraggedTodo] = useState<TodoWithDetails | null>(null)

  const columns = [
    { id: 'open' as const, label: 'Offen', color: 'bg-gray-100 dark:bg-gray-700' },
    { id: 'in_progress' as const, label: 'In Bearbeitung', color: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 'question' as const, label: 'Rückfrage', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { id: 'done' as const, label: 'Erledigt', color: 'bg-green-100 dark:bg-green-900/30' },
  ]

  useEffect(() => {
    if (currentCompany) {
      loadTodos()
    }
  }, [currentCompany])

  const loadTodos = async () => {
    if (!currentCompany || !user) return

    try {
      setLoading(true)
      const todosData = await getCompanyTodos(supabase, currentCompany.id)
      // Filter out archived todos
      const activeTodos = todosData.filter(t => !t.archived)
      setTodos(activeTodos)
    } catch (error) {
      console.error('Error loading todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, todo: TodoWithDetails) => {
    setDraggedTodo(todo)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: 'open' | 'in_progress' | 'question' | 'done') => {
    e.preventDefault()
    if (!draggedTodo || draggedTodo.status === newStatus) {
      setDraggedTodo(null)
      return
    }

    try {
      await updateTodoStatus(supabase, draggedTodo.id, newStatus, undefined, user?.id)
      await loadTodos()
    } catch (error) {
      console.error('Error updating todo:', error)
      alert('Fehler beim Verschieben des ToDos')
    } finally {
      setDraggedTodo(null)
    }
  }

  const getTodosByStatus = (status: string) => {
    return todos.filter(todo => todo.status === status)
  }

  const getTodoCard = (todo: TodoWithDetails) => {
    const priorityColors = {
      low: 'border-l-gray-400',
      medium: 'border-l-blue-500',
      high: 'border-l-orange-500',
      urgent: 'border-l-red-500',
    }

    return (
      <div
        key={todo.id}
        draggable
        onDragStart={(e) => handleDragStart(e, todo)}
        onClick={() => router.push(`/${companySlug}/todos/${todo.id}`)}
        className={`bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 border-l-4 ${priorityColors[todo.priority]} shadow-sm hover:shadow-md transition cursor-move`}
      >
        <h4 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
          {todo.title}
        </h4>

        {todo.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {todo.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {/* Priority Icon */}
          {todo.priority === 'urgent' && <span>🔥</span>}
          {todo.priority === 'high' && <span>⚠️</span>}

          {/* Assignees */}
          {todo.assignees.length > 0 && (
            <div className="flex -space-x-1" title={todo.assignees.map(a => a.full_name || a.user_email).join(', ')}>
              {todo.assignees.slice(0, 3).map((assignee) => {
                const name = assignee.full_name || assignee.user_email
                const initials = name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2)
                return (
                  <div
                    key={assignee.user_id}
                    className="w-6 h-6 rounded-full bg-blue-600 border border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-medium"
                    title={name}
                  >
                    {initials}
                  </div>
                )
              })}
              {todo.assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-400 border border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-medium">
                  +{todo.assignees.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Subtasks Count */}
          {todo.subtasks.length > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {todo.subtasks.length}
            </span>
          )}

          {/* Deadline */}
          {todo.deadline && (
            <span className="flex items-center gap-1 ml-auto">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(todo.deadline).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Lade Board...</p>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
        {columns.map((column) => {
          const columnTodos = getTodosByStatus(column.id)

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="flex flex-col bg-gray-50 dark:bg-gray-900 rounded-xl p-4"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    column.id === 'open' ? 'bg-gray-400' :
                    column.id === 'in_progress' ? 'bg-blue-500' :
                    column.id === 'question' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}></span>
                  {column.label}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
                  {columnTodos.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px]">
                {columnTodos.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    Keine ToDos
                  </div>
                ) : (
                  columnTodos.map((todo) => getTodoCard(todo))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
