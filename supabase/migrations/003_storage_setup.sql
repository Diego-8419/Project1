-- =====================================================
-- Supabase Storage Buckets and Policies
-- Multi-Tenant ToDo Application
-- =====================================================

-- =====================================================
-- CREATE STORAGE BUCKETS
-- =====================================================

-- Bucket for todo and comment attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false);

-- Bucket for company document library
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- =====================================================
-- STORAGE POLICIES - ATTACHMENTS
-- =====================================================

-- Users can upload attachments to todos they have access to
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can read attachments from their companies
CREATE POLICY "Users can read attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments'
  AND (
    -- User uploaded the file
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Or user is member of the company (folder structure: userId/companyId/filename)
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.user_id = auth.uid()
      AND cm.company_id::text = (storage.foldername(name))[2]
    )
  )
);

-- Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- STORAGE POLICIES - DOCUMENTS
-- =====================================================

-- Company members can upload documents
CREATE POLICY "Company members can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.company_id::text = (storage.foldername(name))[1]
  )
);

-- Company members can read documents
CREATE POLICY "Company members can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.company_id::text = (storage.foldername(name))[1]
  )
);

-- Admins and GL can delete documents
CREATE POLICY "Admins and GL can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.company_id::text = (storage.foldername(name))[1]
    AND cm.role IN ('admin', 'gl')
  )
);

-- =====================================================
-- STORAGE POLICIES - AVATARS
-- =====================================================

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
