'use client'

/**
 * Kanban Board Page
 * ToDo-Verwaltung in Kanban-Ansicht mit Drag & Drop
 */

import { useCompanyStore } from '@/lib/stores/companyStore'
import { useParams } from 'next/navigation'
import KanbanBoard from '@/components/todos/KanbanBoard'

export default function KanbanBoardPage() {
  const { currentCompany } = useCompanyStore()
  const params = useParams()
  const companySlug = params.companySlug as string

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

  const roleLabels = {
    admin: 'Administrator',
    gl: 'Geschäftsleitung',
    superuser: 'Superuser',
    user: 'Benutzer',
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Board-Ansicht
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {currentCompany.name} - Rolle: {roleLabels[currentCompany.role]}
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard companySlug={companySlug} />
      </div>
    </div>
  )
}
