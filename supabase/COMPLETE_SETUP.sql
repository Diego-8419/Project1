-- =====================================================
-- COMPLETE SUPABASE SETUP
-- Führe dieses Script EINMAL im SQL Editor von Supabase aus
-- Es erstellt alle Tabellen, Policies, Trigger und Functions
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. CUSTOM TYPES
-- =====================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'gl', 'superuser', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE todo_status AS ENUM ('open', 'in_progress', 'question', 'done');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE todo_priority AS ENUM ('urgent', 'high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE permission_level AS ENUM ('view_only', 'comment_only', 'full_access');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('todo_assigned', 'comment_added', 'status_changed', 'mention', 'deadline_reminder');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 3. TABLES
-- =====================================================

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company Members
CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Superuser Permissions
CREATE TABLE IF NOT EXISTS superuser_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  superuser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (company_id IS NOT NULL OR target_user_id IS NOT NULL)
);

-- ToDos
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status todo_status DEFAULT 'open',
  status_note TEXT,
  priority todo_priority DEFAULT 'medium',
  priority_order INTEGER DEFAULT 0,
  deadline DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Todo Assignees
CREATE TABLE IF NOT EXISTS todo_assignees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(todo_id, user_id)
);

-- Todo Permissions
CREATE TABLE IF NOT EXISTS todo_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level permission_level NOT NULL DEFAULT 'view_only',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(todo_id, user_id)
);

-- Subtasks
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subtask Assignees
CREATE TABLE IF NOT EXISTS subtask_assignees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subtask_id UUID NOT NULL REFERENCES subtasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subtask_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_question BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Todo Documents (Link table)
CREATE TABLE IF NOT EXISTS todo_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(todo_id, document_id)
);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (todo_id IS NOT NULL OR comment_id IS NOT NULL)
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  todo_id UUID REFERENCES todos(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_todos_company ON todos(company_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_created_by ON todos(created_by);
CREATE INDEX IF NOT EXISTS idx_todo_assignees_todo ON todo_assignees(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_assignees_user ON todo_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_todo ON subtasks(todo_id);
CREATE INDEX IF NOT EXISTS idx_comments_todo ON comments(todo_id);
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_company ON activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_todo ON activity_logs(todo_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE superuser_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtask_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view companies they are members of" ON companies;
DROP POLICY IF EXISTS "Anyone can create companies" ON companies;
DROP POLICY IF EXISTS "Admins can update their companies" ON companies;
DROP POLICY IF EXISTS "Admins can delete their companies" ON companies;
DROP POLICY IF EXISTS "Users can view members of their companies" ON company_members;
DROP POLICY IF EXISTS "Anyone can add first member" ON company_members;
DROP POLICY IF EXISTS "Admins can add members" ON company_members;
DROP POLICY IF EXISTS "Admins can update members" ON company_members;
DROP POLICY IF EXISTS "Admins can delete members" ON company_members;

-- User Profiles Policies
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Companies Policies
CREATE POLICY "Users can view companies they are members of" ON companies FOR SELECT
  USING (EXISTS (SELECT 1 FROM company_members WHERE company_members.company_id = companies.id AND company_members.user_id = auth.uid()));
CREATE POLICY "Anyone can create companies" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update their companies" ON companies FOR UPDATE
  USING (EXISTS (SELECT 1 FROM company_members WHERE company_members.company_id = companies.id AND company_members.user_id = auth.uid() AND company_members.role = 'admin'));
CREATE POLICY "Admins can delete their companies" ON companies FOR DELETE
  USING (EXISTS (SELECT 1 FROM company_members WHERE company_members.company_id = companies.id AND company_members.user_id = auth.uid() AND company_members.role = 'admin'));

-- Company Members Policies
CREATE POLICY "Users can view members of their companies" ON company_members FOR SELECT
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));
CREATE POLICY "Anyone can add first member" ON company_members FOR INSERT
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = company_members.company_id)
    AND user_id = auth.uid()
    AND role = 'admin'
  );
CREATE POLICY "Admins can add members" ON company_members FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = company_members.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'));
CREATE POLICY "Admins can update members" ON company_members FOR UPDATE
  USING (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = company_members.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'));
CREATE POLICY "Admins can delete members" ON company_members FOR DELETE
  USING (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = company_members.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'));

-- Superuser Permissions Policies
DROP POLICY IF EXISTS "Admins can manage superuser permissions" ON superuser_permissions;
CREATE POLICY "Admins can manage superuser permissions" ON superuser_permissions FOR ALL USING (true);

-- ToDos Policies
DROP POLICY IF EXISTS "Users can view todos in their companies" ON todos;
DROP POLICY IF EXISTS "Company members can create todos" ON todos;
DROP POLICY IF EXISTS "Users can update todos" ON todos;
DROP POLICY IF EXISTS "Admins can delete todos" ON todos;

CREATE POLICY "Users can view todos in their companies" ON todos FOR SELECT
  USING (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = todos.company_id AND cm.user_id = auth.uid()));
CREATE POLICY "Company members can create todos" ON todos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = todos.company_id AND cm.user_id = auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Users can update todos" ON todos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = todos.company_id AND cm.user_id = auth.uid()));
CREATE POLICY "Admins can delete todos" ON todos FOR DELETE
  USING (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = todos.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'));

-- Todo Assignees Policies
DROP POLICY IF EXISTS "Users can view assignees" ON todo_assignees;
DROP POLICY IF EXISTS "Users can manage assignees" ON todo_assignees;
CREATE POLICY "Users can view assignees" ON todo_assignees FOR SELECT USING (true);
CREATE POLICY "Users can manage assignees" ON todo_assignees FOR ALL USING (true);

-- Todo Permissions Policies
DROP POLICY IF EXISTS "Users can view permissions" ON todo_permissions;
DROP POLICY IF EXISTS "Users can manage permissions" ON todo_permissions;
CREATE POLICY "Users can view permissions" ON todo_permissions FOR SELECT USING (true);
CREATE POLICY "Users can manage permissions" ON todo_permissions FOR ALL USING (true);

-- Subtasks Policies
DROP POLICY IF EXISTS "Users can view subtasks" ON subtasks;
DROP POLICY IF EXISTS "Users can manage subtasks" ON subtasks;
CREATE POLICY "Users can view subtasks" ON subtasks FOR SELECT USING (true);
CREATE POLICY "Users can manage subtasks" ON subtasks FOR ALL USING (true);

-- Subtask Assignees Policies
DROP POLICY IF EXISTS "Users can view subtask assignees" ON subtask_assignees;
DROP POLICY IF EXISTS "Users can manage subtask assignees" ON subtask_assignees;
CREATE POLICY "Users can view subtask assignees" ON subtask_assignees FOR SELECT USING (true);
CREATE POLICY "Users can manage subtask assignees" ON subtask_assignees FOR ALL USING (true);

-- Comments Policies
DROP POLICY IF EXISTS "Users can view comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (user_id = auth.uid());

-- Documents Policies
DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Users can upload documents" ON documents;
DROP POLICY IF EXISTS "Users can update documents" ON documents;
DROP POLICY IF EXISTS "Users can delete documents" ON documents;
CREATE POLICY "Users can view documents" ON documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = documents.company_id AND cm.user_id = auth.uid()));
CREATE POLICY "Users can upload documents" ON documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = documents.company_id AND cm.user_id = auth.uid()) AND uploaded_by = auth.uid());
CREATE POLICY "Users can update documents" ON documents FOR UPDATE
  USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = documents.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'));
CREATE POLICY "Users can delete documents" ON documents FOR DELETE
  USING (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = documents.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'));

-- Todo Documents Policies
DROP POLICY IF EXISTS "Users can view todo documents" ON todo_documents;
DROP POLICY IF EXISTS "Users can manage todo documents" ON todo_documents;
CREATE POLICY "Users can view todo documents" ON todo_documents FOR SELECT USING (true);
CREATE POLICY "Users can manage todo documents" ON todo_documents FOR ALL USING (true);

-- Attachments Policies
DROP POLICY IF EXISTS "Users can view attachments" ON attachments;
DROP POLICY IF EXISTS "Users can upload attachments" ON attachments;
DROP POLICY IF EXISTS "Users can delete attachments" ON attachments;
CREATE POLICY "Users can view attachments" ON attachments FOR SELECT USING (true);
CREATE POLICY "Users can upload attachments" ON attachments FOR INSERT WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Users can delete attachments" ON attachments FOR DELETE USING (uploaded_by = auth.uid());

-- Activity Logs Policies
DROP POLICY IF EXISTS "Users can view activity logs" ON activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "Users can view activity logs" ON activity_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = activity_logs.company_id AND cm.user_id = auth.uid()));
CREATE POLICY "System can insert activity logs" ON activity_logs FOR INSERT WITH CHECK (true);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (user_id = auth.uid());

-- Push Subscriptions Policies
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 5. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subtasks_updated_at ON subtasks;
CREATE TRIGGER update_subtasks_updated_at BEFORE UPDATE ON subtasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 6. STORAGE BUCKETS
-- =====================================================

-- Diese werden über die Supabase UI erstellt:
-- 1. attachments (private)
-- 2. documents (private)
-- 3. avatars (public)

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
