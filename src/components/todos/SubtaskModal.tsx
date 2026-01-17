'use client'

/**
 * Subtask Modal
 * Modal zum Erstellen und Bearbeiten von Subtasks
 */

import { useState, useEffect } from 'react'

interface SubtaskModalProps {
  todoId: string
  subtask?: {
    id: string
    title: string
    description: string | null
    status: 'open' | 'in_progress' | 'question' | 'done'
  }
  onClose: () => void
  onSave: (data: {
    title: string
    description: string
    status: 'open' | 'in_progress' | 'question' | 'done'
  }) => Promise<void>
}

export default function SubtaskModal({
  todoId,
  subtask,
  onClose,
  onSave,
}: SubtaskModalProps) {
  const [title, setTitle] = useState(subtask?.title || '')
  const [description, setDescription] = useState(subtask?.description || '')
  const [status, setStatus] = useState<'open' | 'in_progress' | 'question' | 'done'>(subtask?.status || 'open')
  const [saving, setSaving] = useState(false)

  const isEdit = !!subtask

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('Bitte geben Sie einen Titel ein')
      return
    }

    try {
      setSaving(true)
      await onSave({
        title: title.trim(),
        description: description.trim(),
        status,
      })
      onClose()
    } catch (error) {
      console.error('Error saving subtask:', error)
      alert('Fehler beim Speichern des Subtasks')
    } finally {
      setSaving(false)
    }
  }

  const statusLabels = {
    open: 'Offen',
    in_progress: 'In Bearbeitung',
    question: 'Rückfrage',
    done: 'Erledigt',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Subtask bearbeiten' : 'Neuer Subtask'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titel *
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Subtask-Titel eingeben..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Beschreibung
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Optionale Beschreibung..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="open">{statusLabels.open}</option>
                <option value="in_progress">{statusLabels.in_progress}</option>
                <option value="question">{statusLabels.question}</option>
                <option value="done">{statusLabels.done}</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Speichert...' : isEdit ? 'Änderungen speichern' : 'Subtask erstellen'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
