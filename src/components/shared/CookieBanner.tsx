'use client'

/**
 * Cookie Banner Component
 * DSGVO-konformer Cookie-Hinweis
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Prüfe, ob der Nutzer bereits zugestimmt hat
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setShowBanner(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40"></div>

      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              {/* Cookie Icon */}
              <div className="flex-shrink-0">
                <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Cookie-Hinweis
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Wir verwenden technisch notwendige Cookies, um die Funktionalität dieser Anwendung zu gewährleisten. Diese Cookies sind für die Authentifizierung und den Betrieb der Anwendung zwingend erforderlich.
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    Verwendete Cookies:
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• <strong>Authentifizierung:</strong> Zur Verwaltung Ihrer Anmeldung</li>
                    <li>• <strong>Session-Verwaltung:</strong> Zur Speicherung Ihrer Sitzungsdaten</li>
                    <li>• <strong>Präferenzen:</strong> Zur Speicherung von Einstellungen (z.B. Dark Mode)</li>
                  </ul>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Diese Cookies können nicht deaktiviert werden, da sie für die Funktion der Anwendung notwendig sind. Wir verwenden keine Tracking- oder Marketing-Cookies.
                </p>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Weitere Informationen finden Sie in unserer{' '}
                  <Link href="/datenschutz" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Datenschutzerklärung
                  </Link>
                  .
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAccept}
                    className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                  >
                    Verstanden
                  </button>
                  <button
                    onClick={handleDecline}
                    className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Ablehnen & Verlassen
                  </button>
                  <Link
                    href="/datenschutz"
                    className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center"
                  >
                    Mehr erfahren
                  </Link>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                  Hinweis: Wenn Sie ablehnen, können Sie die Anwendung nicht nutzen, da die Cookies für die Funktionalität zwingend erforderlich sind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
