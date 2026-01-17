'use client'

/**
 * Activity Timeline Component
 * Zeigt die Aktivitäts-History eines ToDos mit zuklappbaren Einträgen
 */

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface Activity {
  id: string
  timestamp: string
  type: 'status_change' | 'created' | 'updated' | 'assigned'
  user: {
    name: string
    email: string
  }
  oldValue?: string
  newValue?: string
  note?: string
}

interface ActivityTimelineProps {
  activities: Activity[]
  expandAll?: boolean
}

export default function ActivityTimeline({ activities, expandAll = false }: ActivityTimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    expandAll ? new Set(activities.map(a => a.id)) : new Set()
  )

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (expandedIds.size === activities.length) {
      setExpandedIds(new Set())
    } else {
      setExpandedIds(new Set(activities.map(a => a.id)))
    }
  }

  const statusLabels: Record<string, string> = {
    open: 'Offen',
    in_progress: 'In Bearbeitung',
    question: 'Rückfrage',
    done: 'Erledigt',
  }

  const statusColors: Record<string, string> = {
    open: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    question: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    done: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  }

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'status_change':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'created':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )
      case 'updated':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
      case 'assigned':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
    }
  }

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'status_change':
        return (
          <span>
            Status geändert von{' '}
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[activity.oldValue || 'open']}`}>
              {statusLabels[activity.oldValue || 'open']}
            </span>
            {' '}zu{' '}
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[activity.newValue || 'open']}`}>
              {statusLabels[activity.newValue || 'open']}
            </span>
          </span>
        )
      case 'created':
        return 'ToDo erstellt'
      case 'updated':
        return 'ToDo aktualisiert'
      case 'assigned':
        return (
          <span>
            Zugewiesen an <strong>{activity.newValue}</strong>
          </span>
        )
      default:
        return 'Aktivität'
    }
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-sm italic">Noch keine Aktivitäten</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header mit Expand/Collapse All */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aktivitäts-Timeline ({activities.length})
        </h3>
        <button
          onClick={toggleAll}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {expandedIds.size === activities.length ? 'Alle zuklappen' : 'Alle aufklappen'}
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {activities.map((activity, index) => {
          const isExpanded = expandedIds.has(activity.id)
          const hasNote = !!activity.note

          return (
            <div
              key={activity.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Timeline Entry Header */}
              <button
                onClick={() => toggleExpanded(activity.id)}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                {/* Timeline Dot & Line */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  {index < activities.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-1"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getActivityText(activity)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {activity.user.name} · {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: de })}
                      </p>
                    </div>
                    {hasNote && (
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>

              {/* Expandable Note Section */}
              {hasNote && isExpanded && (
                <div className="px-4 pb-4 pl-17 border-t border-gray-100 dark:border-gray-700 pt-3">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notiz:
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {activity.note}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
