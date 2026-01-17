'use client'

/**
 * Todos Page
 * ToDo-Liste mit Erstellung und Verwaltung
 */

import { useEffect, useState } from 'react'
import { useCompanyStore } from '@/lib/stores/companyStore'
import { useAuthStore } from '@/lib/stores/authStore'
import { createClient } from '@/lib/supabase/client'
import { getCompanyTodos, type TodoWithDetails } from '@/lib/db/todos'
import { filterTodosByPermissions } from '@/lib/utils/permissions'
import TodoList from '@/components/todos/TodoList'
import CreateTodoModal from '@/components/todos/CreateTodoModal'

export default function TodosPage() {
  const supabase = createClient()
  const { currentCompany } = useCompanyStore()
  const { user } = useAuthStore()

  const [todos, setTodos] = useState<TodoWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'question' | 'done'>('all')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    if (currentCompany) {
      loadTodos()
    }
  }, [currentCompany])

  const loadTodos = async () => {
    if (!currentCompany || !user) return

    try {
      setLoading(true)
      const allTodos = await getCompanyTodos(supabase, currentCompany.id)

      // App-Level Security: Filtere ToDos basierend auf Berechtigungen
      const filteredTodos = filterTodosByPermissions(allTodos, user.id, currentCompany)
      setTodos(filteredTodos)
    } catch (error) {
      console.error('Error loading todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTodoCreated = () => {
    setShowCreateModal(false)
    loadTodos()
  }

  const handleTodoUpdated = () => {
    loadTodos()
  }

  const handleTodoDeleted = () => {
    loadTodos()
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

  // Filter ToDos
  let filteredTodos = todos

  // Archiv-Filter: Zeige nur archivierte oder nur nicht-archivierte
  filteredTodos = showArchived
    ? filteredTodos.filter(t => t.archived === true)
    : filteredTodos.filter(t => !t.archived)

  // Status-Filter
  if (filter !== 'all') {
    filteredTodos = filteredTodos.filter(t => t.status === filter)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ToDos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentCompany.name}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Neues ToDo
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Alle' },
            { value: 'open', label: 'Offen' },
            { value: 'in_progress', label: 'In Bearbeitung' },
            { value: 'question', label: 'Rückfrage' },
            { value: 'done', label: 'Erledigt' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`px-4 py-2 rounded-lg transition ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Archiv-Toggle */}
        <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Archiviert {showArchived && `(${todos.filter(t => t.archived).length})`}
            </span>
          </label>
        </div>
      </div>

      {/* ToDo Liste */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade ToDos...</p>
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Keine ToDos gefunden
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filter === 'all'
              ? 'Erstellen Sie Ihr erstes ToDo, um zu beginnen.'
              : `Keine ToDos mit Status "${filter === 'open' ? 'Offen' : filter === 'in_progress' ? 'In Bearbeitung' : filter === 'question' ? 'Rückfrage' : 'Erledigt'}" gefunden.`
            }
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Erstes ToDo erstellen
            </button>
          )}
        </div>
      ) : (
        <TodoList
          todos={filteredTodos}
          onTodoUpdated={handleTodoUpdated}
          onTodoDeleted={handleTodoDeleted}
          companySlug={currentCompany.slug}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTodoModal
          companyId={currentCompany.id}
          onClose={() => setShowCreateModal(false)}
          onTodoCreated={handleTodoCreated}
        />
      )}
    </div>
  )
}
