'use client'

/**
 * Status Change Modal
 * Modal zum Ändern des Status mit optionaler Notiz
 */

import { useState } from 'react'

interface StatusChangeModalProps {
  currentStatus: 'open' | 'in_progress' | 'question' | 'done'
  onClose: () => void
  onSave: (newStatus: 'open' | 'in_progress' | 'question' | 'done', note?: string) => Promise<void>
}

export default function StatusChangeModal({
  currentStatus,
  onClose,
  onSave,
}: StatusChangeModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<'open' | 'in_progress' | 'question' | 'done'>(currentStatus)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const statusLabels = {
    open: 'Offen',
    in_progress: 'In Bearbeitung',
    question: 'Rückfrage',
    done: 'Erledigt',
  }

  const statusColors = {
    open: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    question: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    done: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  }

  // Bestimme ob eine Notiz erforderlich ist (für in_progress, question, done)
  const requiresNote = selectedStatus !== 'open'
  const notePlaceholders = {
    in_progress: 'Was wird gerade bearbeitet? (Optional)',
    question: 'Welche Frage besteht? (Optional)',
    done: 'Zusammenfassung oder Abschlussbemerkung (Optional)',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedStatus === currentStatus && !note.trim()) {
      onClose()
      return
    }

    try {
      setSaving(true)
      await onSave(selectedStatus, note.trim() || undefined)
      onClose()
    } catch (error) {
      console.error('Error saving status:', error)
      alert('Fehler beim Speichern des Status')
    } finally {
      setSaving(false)
    }
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Status ändern
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
            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Neuer Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['open', 'in_progress', 'question', 'done'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition ${
                      selectedStatus === status
                        ? statusColors[status] + ' ring-2 ring-blue-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {statusLabels[status]}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Input - zeige nur wenn nicht "Offen" */}
            {requiresNote && (
              <div>
                <label htmlFor="status-note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notiz {selectedStatus === 'question' ? '(empfohlen)' : '(optional)'}
                </label>
                <textarea
                  id="status-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder={notePlaceholders[selectedStatus as keyof typeof notePlaceholders]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Diese Notiz wird in der Aktivitäts-Timeline angezeigt.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Speichert...' : 'Status ändern'}
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
