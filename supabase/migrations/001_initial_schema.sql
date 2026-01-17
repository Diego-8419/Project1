-- =====================================================
-- Multi-Tenant ToDo Application - Initial Schema
-- Deutsche Version
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- User roles within a company
CREATE TYPE user_role AS ENUM ('admin', 'gl', 'user');

-- Todo status
CREATE TYPE todo_status AS ENUM ('open', 'in_progress', 'question', 'done');

-- Todo priority
CREATE TYPE todo_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Permission levels for todos
CREATE TYPE permission_level AS ENUM ('read_only', 'comment_only', 'full_access');

-- Activity log actions
CREATE TYPE activity_action AS ENUM (
  'created',
  'updated',
  'deleted',
  'assigned',
  'unassigned',
  'status_changed',
  'commented',
  'attached_file',
  'linked_document'
);

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'todo_assigned',
  'todo_updated',
  'comment_added',
  'status_changed',
  'deadline_approaching',
  'mentioned'
);

-- =====================================================
-- USER PROFILES
-- =====================================================

CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- =====================================================
-- COMPANIES (Tenants/Mandanten)
-- =====================================================

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-freundlicher Identifier
  settings JSONB DEFAULT '{}', -- Firmenspezifische Einstellungen
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_slug ON companies(slug);

-- =====================================================
-- COMPANY MEMBERS (User-Company-Role Relationship)
-- =====================================================

CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_members_company ON company_members(company_id);
CREATE INDEX idx_company_members_user ON company_members(user_id);
CREATE INDEX idx_company_members_role ON company_members(company_id, role);

-- =====================================================
-- TODOS
-- =====================================================

CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status todo_status DEFAULT 'open',
  priority todo_priority DEFAULT 'medium',
  priority_order INTEGER DEFAULT 0, -- Für manuelle Sortierung
  deadline TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_todos_company ON todos(company_id);
CREATE INDEX idx_todos_status ON todos(company_id, status);
CREATE INDEX idx_todos_created_by ON todos(created_by);
CREATE INDEX idx_todos_deadline ON todos(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_todos_priority_order ON todos(company_id, priority_order);

-- =====================================================
-- TODO ASSIGNEES (Many-to-Many)
-- =====================================================

CREATE TABLE public.todo_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(todo_id, user_id)
);

CREATE INDEX idx_todo_assignees_todo ON todo_assignees(todo_id);
CREATE INDEX idx_todo_assignees_user ON todo_assignees(user_id);

-- =====================================================
-- TODO PERMISSIONS (Fine-grained access control)
-- =====================================================

CREATE TABLE public.todo_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  permission_level permission_level NOT NULL DEFAULT 'read_only',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(todo_id, user_id)
);

CREATE INDEX idx_todo_permissions_todo ON todo_permissions(todo_id);
CREATE INDEX idx_todo_permissions_user ON todo_permissions(user_id);

-- =====================================================
-- SUBTASKS (Unterpunkte)
-- =====================================================

CREATE TABLE public.subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status todo_status DEFAULT 'open',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subtasks_todo ON subtasks(todo_id, order_index);

-- =====================================================
-- SUBTASK ASSIGNEES
-- =====================================================

CREATE TABLE public.subtask_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtask_id UUID NOT NULL REFERENCES subtasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subtask_id, user_id)
);

CREATE INDEX idx_subtask_assignees_subtask ON subtask_assignees(subtask_id);
CREATE INDEX idx_subtask_assignees_user ON subtask_assignees(user_id);

-- =====================================================
-- COMMENTS (Thread support for Rückfragen)
-- =====================================================

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  content TEXT NOT NULL,
  is_question BOOLEAN DEFAULT FALSE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- Für Thread-Antworten
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_todo ON comments(todo_id, created_at);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- =====================================================
-- DOCUMENTS (Firmendokumente-Bibliothek)
-- =====================================================

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL, -- Supabase Storage Pfad
  file_size INTEGER NOT NULL, -- In Bytes
  mime_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_company ON documents(company_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_name ON documents(company_id, name);

-- =====================================================
-- TODO DOCUMENTS (Link documents to todos)
-- =====================================================

CREATE TABLE public.todo_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(todo_id, document_id)
);

CREATE INDEX idx_todo_documents_todo ON todo_documents(todo_id);
CREATE INDEX idx_todo_documents_document ON todo_documents(document_id);

-- =====================================================
-- ATTACHMENTS (Direct file uploads on todos/comments)
-- =====================================================

CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT attachment_parent_check CHECK (
    (todo_id IS NOT NULL AND comment_id IS NULL) OR
    (todo_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE INDEX idx_attachments_todo ON attachments(todo_id) WHERE todo_id IS NOT NULL;
CREATE INDEX idx_attachments_comment ON attachments(comment_id) WHERE comment_id IS NOT NULL;

-- =====================================================
-- ACTIVITY LOGS (Audit Trail)
-- =====================================================

CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  action activity_action NOT NULL,
  entity_type TEXT NOT NULL, -- 'todo', 'subtask', 'comment', etc.
  entity_id UUID NOT NULL,
  changes JSONB, -- Before/after snapshot
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_company ON activity_logs(company_id, created_at DESC);
CREATE INDEX idx_activity_logs_todo ON activity_logs(todo_id) WHERE todo_id IS NOT NULL;
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);

-- =====================================================
-- NOTIFICATIONS (Benachrichtigungen)
-- =====================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- =====================================================
-- PUSH SUBSCRIPTIONS (PWA Push Notifications)
-- =====================================================

CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
