'use client'

/**
 * Header Component
 * Header mit Company Switcher, Benachrichtigungen und User Menu
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import CompanySwitcher from './CompanySwitcher'
import NotificationBell from './NotificationBell'
import ThemeToggle from '@/components/shared/ThemeToggle'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()

  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left: Menu Button + Company Switcher */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Company Switcher */}
          <CompanySwitcher />
        </div>

        {/* Right: Theme + Notifications + User Menu */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications Bell */}
          <NotificationBell />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {/* User Avatar */}
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                ></div>
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20 overflow-hidden">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.email}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Angemeldet
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        router.push('/dashboard')
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Firmenauswahl
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        // TODO: Profil-Seite
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profil
                    </button>
                  </div>

                  {/* Sign Out */}
                  <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Abmelden
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
