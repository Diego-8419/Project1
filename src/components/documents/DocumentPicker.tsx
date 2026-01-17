'use client'

/**
 * Document Picker Component
 * Modal zum Verknüpfen von Dokumenten mit ToDos
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/lib/stores/companyStore'
import { getCompanyDocuments, type DocumentWithUploader } from '@/lib/db/documents'

interface DocumentPickerProps {
  onClose: () => void
  onSelect: (documentId: string) => void
  excludeIds?: string[] // Already linked documents
}

export default function DocumentPicker({ onClose, onSelect, excludeIds = [] }: DocumentPickerProps) {
  const supabase = createClient()
  const { currentCompany } = useCompanyStore()

  const [documents, setDocuments] = useState<DocumentWithUploader[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (currentCompany) {
      loadDocuments()
    }
  }, [currentCompany])

  const loadDocuments = async () => {
    if (!currentCompany) return

    try {
      setLoading(true)
      const data = await getCompanyDocuments(supabase, currentCompany.id)
      // Filter out already linked documents
      const available = data.filter(doc => !excludeIds.includes(doc.id))
      setDocuments(available)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const searchLower = searchQuery.toLowerCase()
    return (
      doc.name.toLowerCase().includes(searchLower) ||
      (doc.description && doc.description.toLowerCase().includes(searchLower))
    )
  })

  const handleSelect = () => {
    if (selectedId) {
      onSelect(selectedId)
      onClose()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    } else if (mimeType === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    } else {
      return (
        <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dokument verknüpfen
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

          {/* Search */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Dokumente durchsuchen..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Documents List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Lade Dokumente...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? 'Keine Dokumente gefunden' : 'Keine Dokumente verfügbar'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedId(doc.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      selectedId === doc.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        {getFileIcon(doc.mime_type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {doc.name}
                        </h3>
                        {doc.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>von {doc.uploader?.full_name || 'Unbekannt'}</span>
                        </div>
                      </div>

                      {/* Radio */}
                      <div className="flex-shrink-0">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedId === doc.id
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedId === doc.id && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSelect}
              disabled={!selectedId}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verknüpfen
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
