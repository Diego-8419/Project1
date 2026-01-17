'use client'

/**
 * Notification Bell Component
 * Zeigt Benachrichtigungen mit Dropdown
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, type Notification } from '@/lib/db/notifications'

export default function NotificationBell() {
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()

  const [showDropdown, setShowDropdown] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadNotifications()
      loadUnreadCount()

      // Real-time subscription
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadNotifications()
            loadUnreadCount()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await getUserNotifications(supabase, user.id, 20)
      setNotifications(data)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    if (!user) return

    try {
      const count = await getUnreadCount(supabase, user.id)
      setUnreadCount(count)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(supabase, notificationId)
      loadNotifications()
      loadUnreadCount()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user) return

    try {
      await markAllAsRead(supabase, user.id)
      loadNotifications()
      loadUnreadCount()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()

    try {
      await deleteNotification(supabase, notificationId)
      loadNotifications()
      loadUnreadCount()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }

    if (notification.todo_id) {
      setShowDropdown(false)
      // Navigiere zum ToDo - wir müssen den company slug finden
      // Für jetzt einfach zur todos liste
      router.push(`/dashboard`)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Gerade eben'
    if (diffMins < 60) return `vor ${diffMins} Min.`
    if (diffHours < 24) return `vor ${diffHours} Std.`
    if (diffDays < 7) return `vor ${diffDays} Tag(en)`
    return date.toLocaleDateString('de-DE')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          ></div>
          <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Benachrichtigungen
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Alle als gelesen markieren
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Keine Benachrichtigungen
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          notification.type === 'todo_assigned' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          notification.type === 'todo_status_changed' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                          notification.type === 'todo_completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {notification.type === 'todo_assigned' && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                          {notification.type === 'todo_status_changed' && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          )}
                          {notification.type === 'todo_completed' && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                !notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={(e) => handleDelete(e, notification.id)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
