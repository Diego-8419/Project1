'use client'

/**
 * Notification Settings Page
 * Benachrichtigungseinstellungen für E-Mail und Push
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCompanyStore } from '@/lib/stores/companyStore'
import { useAuthStore } from '@/lib/stores/authStore'
import { createClient } from '@/lib/supabase/client'

interface NotificationSettings {
  email: {
    enabled: boolean
    on_assignment: boolean
    on_comment: boolean
    on_status_change: boolean
    on_deadline_reminder: boolean
  }
  push: {
    enabled: boolean
    on_assignment: boolean
    on_comment: boolean
    on_status_change: boolean
    on_deadline_reminder: boolean
  }
}

const DEFAULT_SETTINGS: NotificationSettings = {
  email: {
    enabled: true,
    on_assignment: true,
    on_comment: true,
    on_status_change: true,
    on_deadline_reminder: true,
  },
  push: {
    enabled: true,
    on_assignment: true,
    on_comment: true,
    on_status_change: true,
    on_deadline_reminder: true,
  },
}

export default function NotificationsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { currentCompany } = useCompanyStore()
  const { user } = useAuthStore()

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await (supabase as any)
        .from('user_profiles')
        .select('notification_settings')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data?.notification_settings) {
        // Merge mit Defaults
        setSettings({
          email: {
            ...DEFAULT_SETTINGS.email,
            ...(data.notification_settings.email || {}),
          },
          push: {
            ...DEFAULT_SETTINGS.push,
            ...(data.notification_settings.push || {}),
          },
        })
      }
    } catch (err) {
      console.error('Error loading notification settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await (supabase as any)
        .from('user_profiles')
        .update({ notification_settings: settings })
        .eq('id', user.id)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Error saving notification settings:', err)
      setError(err.message || 'Fehler beim Speichern der Einstellungen')
    } finally {
      setSaving(false)
    }
  }

  const updateEmailSetting = (key: keyof NotificationSettings['email'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: value,
        // Wenn enabled deaktiviert wird, alle anderen auch deaktivieren
        ...(key === 'enabled' && !value ? {
          on_assignment: false,
          on_comment: false,
          on_status_change: false,
          on_deadline_reminder: false,
        } : {}),
      },
    }))
  }

  const updatePushSetting = (key: keyof NotificationSettings['push'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      push: {
        ...prev.push,
        [key]: value,
        // Wenn enabled deaktiviert wird, alle anderen auch deaktivieren
        ...(key === 'enabled' && !value ? {
          on_assignment: false,
          on_comment: false,
          on_status_change: false,
          on_deadline_reminder: false,
        } : {}),
      },
    }))
  }

  if (!currentCompany) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
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
          Verwalten Sie, wie und wann Sie benachrichtigt werden möchten.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Einstellungen erfolgreich gespeichert!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Einstellungen...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* E-Mail Benachrichtigungen */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    E-Mail-Benachrichtigungen
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Erhalten Sie wichtige Updates per E-Mail
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.email.enabled}
                  onChange={(e) => updateEmailSetting('enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-teal-500"></div>
              </label>
            </div>

            {/* E-Mail Optionen */}
            <div className={`space-y-4 ${!settings.email.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Bei Zuweisung</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Wenn Ihnen ein ToDo zugewiesen wird
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.on_assignment}
                    onChange={(e) => updateEmailSetting('on_assignment', e.target.checked)}
                    disabled={!settings.email.enabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Bei Kommentar</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Wenn jemand einen Kommentar hinterlässt
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.on_comment}
                    onChange={(e) => updateEmailSetting('on_comment', e.target.checked)}
                    disabled={!settings.email.enabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Bei Statusänderung</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Wenn sich der Status eines ToDos ändert
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.on_status_change}
                    onChange={(e) => updateEmailSetting('on_status_change', e.target.checked)}
                    disabled={!settings.email.enabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Deadline-Erinnerungen</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Erinnerung vor Ablauf der Deadline
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.on_deadline_reminder}
                    onChange={(e) => updateEmailSetting('on_deadline_reminder', e.target.checked)}
                    disabled={!settings.email.enabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Push Benachrichtigungen */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Push-Benachrichtigungen
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    In-App Benachrichtigungen (PWA)
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.push.enabled}
                  onChange={(e) => updatePushSetting('enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
              </label>
            </div>

            {/* Push Optionen */}
            <div className={`space-y-4 ${!settings.push.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Bei Zuweisung</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Wenn Ihnen ein ToDo zugewiesen wird
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.push.on_assignment}
                    onChange={(e) => updatePushSetting('on_assignment', e.target.checked)}
                    disabled={!settings.push.enabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Bei Kommentar</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Wenn jemand einen Kommentar hinterlässt
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.push.on_comment}
                    onChange={(e) => updatePushSetting('on_comment', e.target.checked)}
                    disabled={!settings.push.enabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Bei Statusänderung</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Wenn sich der Status eines ToDos ändert
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.push.on_status_change}
                    onChange={(e) => updatePushSetting('on_status_change', e.target.checked)}
                    disabled={!settings.push.enabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Deadline-Erinnerungen</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Erinnerung vor Ablauf der Deadline
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.push.on_deadline_reminder}
                    onChange={(e) => updatePushSetting('on_deadline_reminder', e.target.checked)}
                    disabled={!settings.push.enabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Einstellungen speichern
                </>
              )}
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-teal-900 dark:text-teal-200 mb-1">
                  Hinweis zu E-Mail-Benachrichtigungen
                </h4>
                <p className="text-sm text-teal-800 dark:text-teal-300">
                  E-Mail-Benachrichtigungen werden an Ihre registrierte E-Mail-Adresse gesendet.
                  Push-Benachrichtigungen funktionieren nur, wenn Sie die App als PWA installiert haben.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
