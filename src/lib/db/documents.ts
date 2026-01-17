/**
 * Documents Database Queries
 * Funktionen für Dokumentenverwaltung
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export type Document = {
  id: string
  company_id: string
  name: string
  description: string | null
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by: string
  created_at: string
  updated_at: string
}

export type DocumentWithUploader = Document & {
  uploader: {
    email: string
    full_name: string | null
  }
}

/**
 * Holt alle Dokumente einer Firma
 */
export async function getCompanyDocuments(
  supabase: SupabaseClient<Database>,
  companyId: string
): Promise<DocumentWithUploader[]> {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      uploader:user_profiles!documents_uploaded_by_fkey(email, full_name)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error loading documents:', error)
    throw error
  }

  return (data || []).map((doc: any) => ({
    ...doc,
    uploader: doc.uploader || { email: 'Unbekannt', full_name: null }
  })) as DocumentWithUploader[]
}

/**
 * Holt ein einzelnes Dokument
 */
export async function getDocumentById(
  supabase: SupabaseClient<Database>,
  documentId: string
): Promise<DocumentWithUploader | null> {
  const { data, error } = await (supabase as any)
    .from('documents')
    .select(`
      *,
      uploader:user_profiles!documents_uploaded_by_fkey(email, full_name)
    `)
    .eq('id', documentId)
    .single()

  if (error) {
    console.error('Error loading document:', error)
    return null
  }

  return {
    ...(data as any),
    uploader: data.uploader || { email: 'Unbekannt', full_name: null }
  } as DocumentWithUploader
}

/**
 * Erstellt ein Dokument (nach Upload)
 */
export async function createDocument(
  supabase: SupabaseClient<Database>,
  params: {
    companyId: string
    name: string
    description?: string
    filePath: string
    fileSize: number
    mimeType: string
    uploadedBy: string
  }
): Promise<Document> {
  const { data, error } = await (supabase as any)
    .from('documents')
    .insert({
      company_id: params.companyId,
      name: params.name,
      description: params.description || null,
      file_path: params.filePath,
      file_size: params.fileSize,
      mime_type: params.mimeType,
      uploaded_by: params.uploadedBy,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating document:', error)
    throw error
  }

  return data as Document
}

/**
 * Aktualisiert ein Dokument
 */
export async function updateDocument(
  supabase: SupabaseClient<Database>,
  documentId: string,
  updates: {
    name?: string
    description?: string
  }
): Promise<Document> {
  const { data, error } = await (supabase as any)
    .from('documents')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId)
    .select()
    .single()

  if (error) {
    console.error('Error updating document:', error)
    throw error
  }

  return data as Document
}

/**
 * Löscht ein Dokument
 */
export async function deleteDocument(
  supabase: SupabaseClient<Database>,
  documentId: string,
  filePath: string
): Promise<void> {
  // Lösche zuerst die Datei aus dem Storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([filePath])

  if (storageError) {
    console.error('Error deleting file from storage:', storageError)
    // Trotzdem weitermachen mit DB-Löschung
  }

  // Lösche den Datenbankeintrag
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)

  if (error) {
    console.error('Error deleting document:', error)
    throw error
  }
}

/**
 * Verknüpft ein Dokument mit einem ToDo
 */
export async function linkDocumentToTodo(
  supabase: SupabaseClient<Database>,
  todoId: string,
  documentId: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from('todo_documents')
    .insert({
      todo_id: todoId,
      document_id: documentId,
    })

  if (error) {
    console.error('Error linking document to todo:', error)
    throw error
  }
}

/**
 * Entfernt Verknüpfung zwischen Dokument und ToDo
 */
export async function unlinkDocumentFromTodo(
  supabase: SupabaseClient<Database>,
  todoId: string,
  documentId: string
): Promise<void> {
  const { error } = await supabase
    .from('todo_documents')
    .delete()
    .eq('todo_id', todoId)
    .eq('document_id', documentId)

  if (error) {
    console.error('Error unlinking document from todo:', error)
    throw error
  }
}

/**
 * Holt alle Dokumente die mit einem ToDo verknüpft sind
 */
export async function getTodoDocuments(
  supabase: SupabaseClient<Database>,
  todoId: string
): Promise<DocumentWithUploader[]> {
  const { data, error } = await supabase
    .from('todo_documents')
    .select(`
      document:documents(
        *,
        uploader:user_profiles!documents_uploaded_by_fkey(email, full_name)
      )
    `)
    .eq('todo_id', todoId)

  if (error) {
    console.error('Error loading todo documents:', error)
    throw error
  }

  return (data || [])
    .map((item: any) => item.document)
    .filter((doc: any) => doc !== null)
    .map((doc: any) => ({
      ...doc,
      uploader: doc.uploader || { email: 'Unbekannt', full_name: null }
    })) as DocumentWithUploader[]
}

/**
 * Upload-Funktion für Dokumente
 */
export async function uploadDocument(
  supabase: SupabaseClient<Database>,
  params: {
    companyId: string
    file: File
    userId: string
    description?: string
  }
): Promise<Document> {
  // Generiere eindeutigen Dateinamen
  const fileExt = params.file.name.split('.').pop()
  const fileName = `${params.companyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  // Upload zu Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, params.file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    throw uploadError
  }

  // Erstelle Datenbankeintrag
  const document = await createDocument(supabase, {
    companyId: params.companyId,
    name: params.file.name,
    description: params.description,
    filePath: uploadData.path,
    fileSize: params.file.size,
    mimeType: params.file.type,
    uploadedBy: params.userId,
  })

  return document
}

/**
 * Download-URL für ein Dokument erstellen
 */
export async function getDocumentDownloadUrl(
  supabase: SupabaseClient<Database>,
  filePath: string
): Promise<string> {
  const { data } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath)

  return data.publicUrl
}
