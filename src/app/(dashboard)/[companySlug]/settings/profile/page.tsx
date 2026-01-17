'use client'

/**
 * Profile Settings Page
 * Benutzer kann eigene Daten bearbeiten
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data) {
        setFullName((data as any).full_name || '')
        setEmail((data as any).email || user.email || '')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setMessage(null)

    try {
      // Update user_profiles
      const { error: profileError } = await (supabase as any)
        .from('user_profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

      if (profileError) throw profileError

      setMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert!' })
    } catch (error: any) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: error.message || 'Fehler beim Speichern' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwörter stimmen nicht überein' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Passwort muss mindestens 6 Zeichen lang sein' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Passwort erfolgreich geändert!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Error changing password:', error)
      setMessage({ type: 'error', text: error.message || 'Fehler beim Ändern des Passworts' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Profil...</p>
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
          Mein Profil
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Persönliche Daten und Passwort verwalten
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profil-Daten */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Profil-Informationen
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vollständiger Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Max Mustermann"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                E-Mail-Adresse kann nicht geändert werden
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Wird gespeichert...' : 'Profil speichern'}
            </button>
          </form>
        </div>

        {/* Passwort ändern */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Passwort ändern
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Neues Passwort
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Passwort bestätigen
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !newPassword || !confirmPassword}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Wird gespeichert...' : 'Passwort ändern'}
            </button>
          </form>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Ihre Profildaten werden in allen Firmen verwendet, in denen Sie Mitglied sind.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
