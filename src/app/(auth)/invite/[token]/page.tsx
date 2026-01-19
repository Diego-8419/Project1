'use client'

/**
 * Einladungs-Annahme-Seite
 * Benutzer können hier eine Einladung annehmen, Datenschutz bestätigen und Passwort setzen
 */

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ConsentModal from '@/components/auth/ConsentModal'

interface InvitationData {
  id: string
  company_id: string
  company_name: string
  email: string
  name: string
  role: string
  expires_at: string
}

export default function InviteAcceptPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'loading' | 'consent' | 'register' | 'success' | 'error'>('loading')

  // Registration form state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (token) {
      loadInvitation()
    }
  }, [token])

  const loadInvitation = async () => {
    try {
      setLoading(true)

      // Lade Einladung mit Firmenname
      const { data, error } = await (supabase as any)
        .from('pending_invitations')
        .select(`
          id,
          company_id,
          email,
          name,
          role,
          expires_at,
          companies (
            name
          )
        `)
        .eq('token', token)
        .single()

      if (error || !data) {
        setError('Einladung nicht gefunden oder ungültig.')
        setStep('error')
        return
      }

      // Prüfe ob abgelaufen
      if (new Date(data.expires_at) < new Date()) {
        setError('Diese Einladung ist abgelaufen. Bitte kontaktieren Sie Ihren Administrator für eine neue Einladung.')
        setStep('error')
        return
      }

      setInvitation({
        id: data.id,
        company_id: data.company_id,
        company_name: (data.companies as any)?.name || 'Unbekannt',
        email: data.email,
        name: data.name,
        role: data.role,
        expires_at: data.expires_at,
      })
      setStep('consent')
    } catch (err) {
      console.error('Error loading invitation:', err)
      setError('Fehler beim Laden der Einladung.')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const handleConsentAccept = () => {
    setStep('register')
  }

  const handleConsentDecline = () => {
    router.push('/login')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!invitation) return

    if (!privacyAccepted) {
      setError('Bitte bestätigen Sie die Datenschutzerklärung.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.')
      return
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // 1. Registriere Benutzer in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
        options: {
          data: {
            full_name: invitation.name,
          },
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Benutzer konnte nicht erstellt werden.')
      }

      // 2. Erstelle user_profiles Eintrag
      const { error: profileError } = await (supabase as any)
        .from('user_profiles')
        .upsert({
          id: authData.user.id,
          email: invitation.email,
          full_name: invitation.name,
        }, { onConflict: 'id' })

      if (profileError) {
        console.log('Profile creation handled by trigger or already exists')
      }

      // 3. Füge Benutzer zur Firma hinzu
      const { error: memberError } = await (supabase as any)
        .from('company_members')
        .insert({
          company_id: invitation.company_id,
          user_id: authData.user.id,
          role: invitation.role,
        })

      if (memberError) {
        console.error('Error adding member:', memberError)
        // Nicht kritisch - wird später behoben
      }

      // 4. Lösche die Einladung
      await supabase
        .from('pending_invitations')
        .delete()
        .eq('id', invitation.id)

      setStep('success')

      // Nach 3 Sekunden zum Login weiterleiten
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Registrierung fehlgeschlagen.')
    } finally {
      setSubmitting(false)
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'gl': return 'Geschäftsleitung'
      case 'superuser': return 'Superuser'
      default: return 'Benutzer'
    }
  }

  // Loading State
  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Lade Einladung...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Einladung ungültig
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {error}
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition"
          >
            Zur Anmeldung
          </Link>
        </div>
      </div>
    )
  }

  // Consent Step
  if (step === 'consent' && invitation) {
    return (
      <ConsentModal
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
        title="Einladung annehmen"
        message={`Sie wurden von ${invitation.company_name} eingeladen, der Firma als ${getRoleName(invitation.role)} beizutreten. Um fortzufahren, müssen Sie die Datenschutzbestimmungen akzeptieren.`}
      />
    )
  }

  // Success State
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12l2.5 2.5L16 9" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Registrierung erfolgreich!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ihr Konto wurde erstellt. Sie werden zur Anmeldung weitergeleitet...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
        </div>
      </div>
    )
  }

  // Register Step
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
            Einladung annehmen
          </h2>
        </div>

        {/* Invitation Info */}
        {invitation && (
          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
            <p className="text-sm text-teal-800 dark:text-teal-200">
              <strong>{invitation.name}</strong>, Sie wurden eingeladen, der Firma{' '}
              <strong>{invitation.company_name}</strong> als{' '}
              <strong>{getRoleName(invitation.role)}</strong> beizutreten.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-6">
          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              E-Mail-Adresse
            </label>
            <input
              type="email"
              value={invitation?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white opacity-75"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 6 Zeichen"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Passwort bestätigen
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Passwort wiederholen"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

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
            disabled={submitting}
            className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? 'Registrierung läuft...' : 'Registrieren & Beitreten'}
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Haben Sie bereits ein Konto?{' '}
              <Link
                href="/login"
                className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 transition"
              >
                Jetzt anmelden
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
  )
}
