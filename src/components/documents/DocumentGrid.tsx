'use client'

/**
 * Document Grid Component
 * Zeigt Dokumente in Grid-Ansicht
 */

import { useState } from 'react'
import { type DocumentWithUploader } from '@/lib/db/documents'

interface DocumentGridProps {
  documents: DocumentWithUploader[]
  onDelete: (documentId: string, filePath: string) => void
  onEdit: (document: DocumentWithUploader) => void
  onDownload: (filePath: string, fileName: string) => void
  canEdit: boolean
}

export default function DocumentGrid({
  documents,
  onDelete,
  onEdit,
  onDownload,
  canEdit,
}: DocumentGridProps) {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    } else if (mimeType === 'application/pdf') {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    } else if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    } else {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">
          Noch keine Dokumente hochgeladen
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition group"
        >
          {/* Icon + File Info */}
          <div className="flex items-start gap-3 mb-3">
            <div className="text-blue-600 dark:text-blue-400 flex-shrink-0">
              {getFileIcon(doc.mime_type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={doc.name}>
                {doc.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatFileSize(doc.file_size)}
              </p>
            </div>
          </div>

          {/* Description */}
          {doc.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {doc.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            <div>Hochgeladen von: {doc.uploader.full_name || doc.uploader.email}</div>
            <div>Am {formatDate(doc.created_at)}</div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(doc.file_path, doc.name)}
              className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition"
            >
              Download
            </button>
            {canEdit && (
              <>
                <button
                  onClick={() => onEdit(doc)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  title="Bearbeiten"
                >
                  ✏️
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Möchten Sie "${doc.name}" wirklich löschen?`)) {
                      onDelete(doc.id, doc.file_path)
                    }
                  }}
                  className="px-3 py-1.5 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 text-xs rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  title="Löschen"
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
