'use client'

/**
 * Passwort-Vergessen-Seite
 * Benutzer können hier einen Link zum Zurücksetzen ihres Passworts anfordern
 */

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (err: any) {
      console.error('Error sending reset email:', err)
      setError(err.message || 'Fehler beim Senden der E-Mail')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl">
        {/* Header with Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12l2.5 2.5L16 9" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl text-gray-900 dark:text-white">
            <em className="font-light italic">Just</em> <span className="font-bold">To Do</span>
          </h1>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
            Passwort vergessen
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen Ihres Passworts zu erhalten.
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-4 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">E-Mail gesendet!</p>
                  <p className="text-sm mt-1">
                    Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen Ihres Passworts gesendet.
                  </p>
                  <p className="text-sm mt-2">
                    Bitte überprüfen Sie auch Ihren Spam-Ordner.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/login"
              className="block w-full text-center py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Zurück zur Anmeldung
            </Link>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  E-Mail-Adresse
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 transition"
                  placeholder="ihre.email@beispiel.de"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Wird gesendet...' : 'Link anfordern'}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 transition"
                >
                  Zurück zur Anmeldung
                </Link>
              </div>
            </form>
          </>
        )}

        {/* Legal Links */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <Link href="/datenschutz" className="hover:text-teal-600 dark:hover:text-teal-400 transition">
              Datenschutz
            </Link>
            <span>•</span>
            <Link href="/impressum" className="hover:text-teal-600 dark:hover:text-teal-400 transition">
              Impressum
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
