'use client'

/**
 * Login-Seite
 * Benutzer können sich mit E-Mail und Passwort anmelden
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ConsentModal from '@/components/auth/ConsentModal'
import CookieBanner from '@/components/shared/CookieBanner'
import SimpleCaptcha from '@/components/auth/SimpleCaptcha'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConsent, setShowConsent] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('user-consent')
    const cookieConsent = localStorage.getItem('cookie-consent')
    if (!consent || !cookieConsent) {
      setShowConsent(true)
    } else {
      setConsentGiven(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!consentGiven) {
      setError('Bitte akzeptieren Sie die Datenschutzerklärung und Cookie-Richtlinien.')
      return
    }

    if (!privacyAccepted) {
      setError('Bitte bestätigen Sie, dass Sie die Datenschutzerklärung gelesen haben und akzeptieren.')
      return
    }

    if (showCaptcha && !captchaVerified) {
      setError('Bitte lösen Sie das Captcha.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.session) {
        setFailedAttempts(0)
        setShowCaptcha(false)
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Anmeldung fehlgeschlagen')
      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)

      if (newAttempts >= 1) {
        setShowCaptcha(true)
        setCaptchaVerified(false)
      }
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
          onDecline={() => {
            alert('Sie müssen die Datenschutzbestimmungen akzeptieren, um die App nutzen zu können.')
          }}
        />
      )}

      <CookieBanner />

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
            Anmelden
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Willkommen zurück! Bitte melden Sie sich an.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
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
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 transition"
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          {showCaptcha && (
            <div className="mb-4">
              <SimpleCaptcha
                onVerify={(success) => {
                  setCaptchaVerified(success)
                  if (!success) {
                    setError('Captcha nicht gelöst.')
                  } else {
                    setError(null)
                  }
                }}
              />
            </div>
          )}

          {/* Privacy Policy Checkbox */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="privacy-checkbox"
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-2 focus:ring-teal-500 text-teal-600"
                required
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="privacy-checkbox" className="text-gray-700 dark:text-gray-300">
                Ich habe die{' '}
                <Link
                  href="/datenschutz"
                  target="_blank"
                  className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 underline"
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
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Wird angemeldet...' : 'Anmelden'}
          </button>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Noch kein Konto?{' '}
              <Link
                href="/register"
                className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 transition"
              >
                Jetzt registrieren
              </Link>
            </p>
          </div>
        </form>

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
    </>
  )
}
