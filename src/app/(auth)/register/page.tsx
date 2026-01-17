'use client'

/**
 * Registrierungs-Seite
 * Neue Benutzer können sich registrieren
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FEATURES } from '@/config/features'
import ConsentModal from '@/components/auth/ConsentModal'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showConsent, setShowConsent] = useState(true)
  const [consentGiven, setConsentGiven] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  // Prüfe ob Registrierung erlaubt ist
  if (!FEATURES.ALLOW_PUBLIC_REGISTRATION) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Registrierung deaktiviert
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Die öffentliche Registrierung ist aktuell nicht verfügbar.
              Bitte kontaktieren Sie Ihren Administrator, um Zugang zu erhalten.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              Zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate privacy acceptance
    if (!privacyAccepted) {
      setError('Bitte bestätigen Sie, dass Sie die Datenschutzerklärung gelesen haben und akzeptieren.')
      setLoading(false)
      return
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      setLoading(false)
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        setSuccess(true)
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'Registrierung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {showConsent && !consentGiven && (
        <ConsentModal
          onAccept={() => {
            setConsentGiven(true)
            setShowConsent(false)
          }}
          onDecline={() => router.push('/login')}
        />
      )}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Registrieren
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Erstellen Sie ein neues Konto
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg text-sm">
            Registrierung erfolgreich! Sie werden weitergeleitet...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleRegister} className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* Full Name Input */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Vollständiger Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 transition"
                placeholder="Max Mustermann"
              />
            </div>

            {/* Email Input */}
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
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 transition"
                placeholder="ihre.email@beispiel.de"
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 transition"
                placeholder="Mindestens 6 Zeichen"
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Passwort bestätigen
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 transition"
                placeholder="Passwort wiederholen"
              />
            </div>
          </div>

          {/* Privacy Policy Checkbox */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="privacy-checkbox"
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 text-blue-600"
                required
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="privacy-checkbox" className="text-gray-700 dark:text-gray-300">
                Ich habe die{' '}
                <Link
                  href="/datenschutz"
                  target="_blank"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  Datenschutzerklärung
                </Link>
                {' '}gelesen und akzeptiere diese.
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Wird registriert...' : 'Registrieren'}
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Haben Sie bereits ein Konto?{' '}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition"
              >
                Jetzt anmelden
              </Link>
            </p>
          </div>
        </form>
        </div>
      </div>
    </>
  )
}
