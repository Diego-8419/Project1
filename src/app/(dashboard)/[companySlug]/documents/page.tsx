'use client'

/**
 * Documents Page
 * Dokumentenverwaltung für die Firma
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { useCompanyStore } from '@/lib/stores/companyStore'
import { getCompanyDocuments, uploadDocument, deleteDocument, updateDocument, getDocumentDownloadUrl, type DocumentWithUploader } from '@/lib/db/documents'
import { isAdminOrGL } from '@/lib/utils/permissions'
import DocumentGrid from '@/components/documents/DocumentGrid'
import DocumentUpload from '@/components/documents/DocumentUpload'

export default function DocumentsPage() {
  const supabase = createClient()
  const { user } = useAuthStore()
  const { currentCompany } = useCompanyStore()

  const [documents, setDocuments] = useState<DocumentWithUploader[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState<DocumentWithUploader | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const canManage = currentCompany ? isAdminOrGL(currentCompany) : false

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
      setDocuments(data)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file: File, description: string) => {
    if (!currentCompany || !user) return

    await uploadDocument(supabase, {
      companyId: currentCompany.id,
      file,
      userId: user.id,
      description,
    })

    loadDocuments()
  }

  const handleDelete = async (documentId: string, filePath: string) => {
    try {
      await deleteDocument(supabase, documentId, filePath)
      loadDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Fehler beim Löschen des Dokuments')
    }
  }

  const handleEdit = (document: DocumentWithUploader) => {
    setEditingDocument(document)
    setEditName(document.name)
    setEditDescription(document.description || '')
    setShowEditModal(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDocument) return

    setSaving(true)
    try {
      await updateDocument(supabase, editingDocument.id, {
        name: editName,
        description: editDescription,
      })
      setShowEditModal(false)
      setEditingDocument(null)
      loadDocuments()
    } catch (error) {
      console.error('Error updating document:', error)
      alert('Fehler beim Aktualisieren des Dokuments')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const url = await getDocumentDownloadUrl(supabase, filePath)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Fehler beim Herunterladen des Dokuments')
    }
  }

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

  // Filter documents based on search
  const filteredDocuments = documents.filter(doc => {
    const searchLower = searchQuery.toLowerCase()
    return (
      doc.name.toLowerCase().includes(searchLower) ||
      (doc.description && doc.description.toLowerCase().includes(searchLower))
    )
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dokumente
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {currentCompany.name} - Rolle: {roleLabels[currentCompany.role]}
        </p>
      </div>

      {/* Search + Upload */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Dokumente durchsuchen..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        {canManage && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Hochladen
          </button>
        )}
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Dokumente...</p>
        </div>
      ) : (
        <DocumentGrid
          documents={filteredDocuments}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onDownload={handleDownload}
          canEdit={canManage}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUpload
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingDocument && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowEditModal(false)}
          ></div>

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Dokument bearbeiten
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div>
                  <label htmlFor="editName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dateiname
                  </label>
                  <input
                    id="editName"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    id="editDescription"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving || !editName}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Wird gespeichert...' : 'Speichern'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

