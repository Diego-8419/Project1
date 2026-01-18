'use client'

/**
 * Settings Page
 * Firmen- und Benutzereinstellungen
 */

import { useRouter, useParams } from 'next/navigation'
import { useCompanyStore } from '@/lib/stores/companyStore'
import { useAuthStore } from '@/lib/stores/authStore'

export default function SettingsPage() {
  const router = useRouter()
  const params = useParams()
  const companySlug = params.companySlug as string
  const { currentCompany } = useCompanyStore()
  const { user } = useAuthStore()

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

  const isAdmin = currentCompany.role === 'admin'
  const isGL = currentCompany.role === 'gl'
  const isAdminOrGL = isAdmin || isGL

  // Einstellungs-Kategorien basierend auf Rolle
  const settingsSections = [
    // Für alle: Profil
    {
      id: 'profile',
      title: 'Mein Profil',
      description: 'Persönliche Daten und Passwort ändern',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => router.push(`/${companySlug}/settings/profile`),
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      available: true,
    },
    // Für Admin/GL: Mitglieder
    {
      id: 'members',
      title: 'Mitglieder',
      description: isAdmin ? 'Benutzer zur Firma hinzufügen und verwalten' : 'Mitglieder verwalten und hinzufügen',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      onClick: () => router.push(`/${companySlug}/settings/members`),
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      available: isAdminOrGL,
    },
    // Nur für Admin: Benutzerverwaltung
    {
      id: 'users',
      title: 'Benutzerverwaltung',
      description: 'Benutzerdaten bearbeiten und Rollen verwalten',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      onClick: () => router.push(`/${companySlug}/settings/users`),
      color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
      available: isAdmin,
    },
    // Nur für Admin: Firmenverwaltung
    {
      id: 'companies',
      title: 'Firmen verwalten',
      description: 'Firmen bearbeiten, löschen und anlegen',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      onClick: () => router.push(`/${companySlug}/settings/companies`),
      color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      available: isAdmin,
    },
    // Nur für Admin: Bezeichnungen anpassen
    {
      id: 'labels',
      title: 'Bezeichnungen',
      description: 'Namen für Firma und Rollen anpassen',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      onClick: () => router.push(`/${companySlug}/settings/labels`),
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      available: isAdmin,
    },
    // Für alle: Benachrichtigungen
    {
      id: 'notifications',
      title: 'Benachrichtigungen',
      description: 'Benachrichtigungseinstellungen verwalten',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      onClick: () => router.push(`/${companySlug}/settings/notifications`),
      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
      available: true,
    },
  ]

  const availableSections = settingsSections.filter(s => s.available)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Einstellungen
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {currentCompany.name} - Rolle: {roleLabels[currentCompany.role]}
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableSections.map((section) => (
          <button
            key={section.id}
            onClick={section.onClick}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition text-left group"
          >
            <div className={`w-16 h-16 rounded-lg ${section.color} flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
              {section.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {section.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {section.description}
            </p>
          </button>
        ))}
      </div>

      {/* Info Box basierend auf Rolle */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-1">
              Ihre Berechtigungen
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {isAdmin && 'Als Administrator haben Sie vollen Zugriff auf alle Einstellungen, können Firmen verwalten und Mitglieder hinzufügen/entfernen.'}
              {isGL && !isAdmin && 'Als Geschäftsleitung können Sie Mitglieder zur Firma hinzufügen und deren Rollen verwalten.'}
              {!isAdminOrGL && 'Als Benutzer können Sie Ihr eigenes Profil und Ihre Benachrichtigungseinstellungen verwalten.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
