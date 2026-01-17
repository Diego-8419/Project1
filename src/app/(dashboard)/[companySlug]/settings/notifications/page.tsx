'use client'

/**
 * Notification Settings Page
 * Benachrichtigungseinstellungen
 */

import { useRouter } from 'next/navigation'
import { useCompanyStore } from '@/lib/stores/companyStore'

export default function NotificationsPage() {
  const router = useRouter()
  const { currentCompany } = useCompanyStore()

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

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Benachrichtigungen
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Benachrichtigungseinstellungen verwalten
        </p>
      </div>

      {/* Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
        <div className="text-6xl mb-4">🔔</div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Benachrichtigungen
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Hier können Sie Ihre Benachrichtigungseinstellungen anpassen
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          In Entwicklung - Wird später implementiert
        </p>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-1">
              Geplante Features
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• E-Mail-Benachrichtigungen bei Zuweisung</li>
              <li>• Push-Benachrichtigungen bei Kommentaren</li>
              <li>• Benachrichtigungen bei Statusänderungen</li>
              <li>• Deadline-Erinnerungen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
