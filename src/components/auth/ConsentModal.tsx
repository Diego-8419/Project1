'use client'

/**
 * Consent Modal Component
 * DSGVO-konforme Zustimmung vor Registrierung
 */

import { useState } from 'react'
import Link from 'next/link'

interface ConsentModalProps {
  onAccept: () => void
  onDecline: () => void
}

export default function ConsentModal({ onAccept, onDecline }: ConsentModalProps) {
  const [acceptedDataPrivacy, setAcceptedDataPrivacy] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedAge, setAcceptedAge] = useState(false)

  const canProceed = acceptedDataPrivacy && acceptedTerms && acceptedAge

  const handleAccept = () => {
    if (canProceed) {
      // Speichere Zustimmung mit Zeitstempel
      const consentData = {
        dataPrivacy: true,
        terms: true,
        age: true,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem('user-consent', JSON.stringify(consentData))
      onAccept()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-50"></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full my-8">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Willkommen!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Bevor Sie sich registrieren, benötigen wir Ihre Zustimmung zu folgenden Punkten:
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Datenschutz */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent-privacy"
                  checked={acceptedDataPrivacy}
                  onChange={(e) => setAcceptedDataPrivacy(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label htmlFor="consent-privacy" className="font-semibold text-gray-900 dark:text-white block mb-2 cursor-pointer">
                    Datenschutzerklärung *
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Ich habe die{' '}
                    <Link href="/datenschutz" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      Datenschutzerklärung
                    </Link>
                    {' '}zur Kenntnis genommen und stimme der Verarbeitung meiner personenbezogenen Daten gemäß DSGVO zu.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium mb-2">Verarbeitete Daten:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>E-Mail-Adresse (verpflichtend)</li>
                      <li>Name (optional)</li>
                      <li>Passwort (verschlüsselt)</li>
                      <li>Nutzungsdaten (ToDos, Dokumente, Kommentare)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Nutzungsbedingungen */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent-terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label htmlFor="consent-terms" className="font-semibold text-gray-900 dark:text-white block mb-2 cursor-pointer">
                    Nutzungsbedingungen *
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Ich akzeptiere die Nutzungsbedingungen und verpflichte mich, die Anwendung verantwortungsvoll zu nutzen.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium mb-2">Wichtige Punkte:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Keine rechtswidrigen Inhalte hochladen</li>
                      <li>Respektvoller Umgang mit anderen Nutzern</li>
                      <li>Keine Weitergabe von Zugangsdaten</li>
                      <li>Vertrauliche Behandlung von Firmendaten</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Altersbestätigung */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent-age"
                  checked={acceptedAge}
                  onChange={(e) => setAcceptedAge(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label htmlFor="consent-age" className="font-semibold text-gray-900 dark:text-white block mb-2 cursor-pointer">
                    Altersbestätigung *
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Ich bestätige, dass ich mindestens 16 Jahre alt bin.
                  </p>
                </div>
              </div>
            </div>

            {/* Zusätzliche Informationen */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    Ihre Rechte
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                    Sie haben jederzeit das Recht auf:
                  </p>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Auskunft über Ihre gespeicherten Daten</li>
                    <li>Berichtigung unrichtiger Daten</li>
                    <li>Löschung Ihrer Daten (Ihr Konto kann jederzeit gelöscht werden)</li>
                    <li>Einschränkung der Verarbeitung</li>
                    <li>Datenübertragbarkeit</li>
                    <li>Widerruf Ihrer Einwilligung</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/datenschutz" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Datenschutzerklärung lesen
              </Link>
              <Link href="/impressum" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Impressum ansehen
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAccept}
                disabled={!canProceed}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canProceed ? 'Zustimmen und fortfahren' : 'Bitte alle Punkte akzeptieren'}
              </button>
              <button
                onClick={onDecline}
                className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Abbrechen
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-3 text-center">
              * Alle markierten Felder sind verpflichtend
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
