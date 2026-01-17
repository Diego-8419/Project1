-- =====================================================
-- FIX FÜR BESTEHENDE DATENBANK
-- Führe dieses Script aus, wenn du bereits Tabellen hast
-- =====================================================

-- =====================================================
-- 1. AUTO-CREATE USER PROFILE TRIGGER
-- Das ist das wichtigste für die Registrierung!
-- =====================================================

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
-- 2. USER PROFILES POLICIES
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 3. COMPANIES POLICIES
-- =====================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view companies they are members of" ON companies;
DROP POLICY IF EXISTS "Anyone can create companies" ON companies;
DROP POLICY IF EXISTS "Admins can create companies" ON companies;
DROP POLICY IF EXISTS "Admins can update their companies" ON companies;
DROP POLICY IF EXISTS "Admins can delete their companies" ON companies;

CREATE POLICY "Users can view companies they are members of" ON companies FOR SELECT
  USING (EXISTS (SELECT 1 FROM company_members WHERE company_members.company_id = companies.id AND company_members.user_id = auth.uid()));
CREATE POLICY "Anyone can create companies" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update their companies" ON companies FOR UPDATE
  USING (EXISTS (SELECT 1 FROM company_members WHERE company_members.company_id = companies.id AND company_members.user_id = auth.uid() AND company_members.role = 'admin'));
CREATE POLICY "Admins can delete their companies" ON companies FOR DELETE
  USING (EXISTS (SELECT 1 FROM company_members WHERE company_members.company_id = companies.id AND company_members.user_id = auth.uid() AND company_members.role = 'admin'));

-- =====================================================
-- 4. COMPANY MEMBERS POLICIES
-- =====================================================

ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view members of their companies" ON company_members;
DROP POLICY IF EXISTS "Anyone can add first member" ON company_members;
DROP POLICY IF EXISTS "Company creators can add first member (themselves)" ON company_members;
DROP POLICY IF EXISTS "Admins can add members" ON company_members;
DROP POLICY IF EXISTS "Admins can add members to their companies" ON company_members;
DROP POLICY IF EXISTS "Admins can update members" ON company_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON company_members;
DROP POLICY IF EXISTS "Admins can delete members" ON company_members;
DROP POLICY IF EXISTS "Admins can remove members" ON company_members;

CREATE POLICY "Users can view members of their companies" ON company_members FOR SELECT
  USING (company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()));

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

-- =====================================================
-- 5. TODOS POLICIES
-- =====================================================

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view todos in their companies" ON todos;
DROP POLICY IF EXISTS "Company members can create todos" ON todos;
DROP POLICY IF EXISTS "Users can update todos" ON todos;
DROP POLICY IF EXISTS "Users can update todos with proper permissions" ON todos;
DROP POLICY IF EXISTS "Admins can delete todos" ON todos;
DROP POLICY IF EXISTS "Only admins can delete todos" ON todos;

CREATE POLICY "Users can view todos in their companies" ON todos FOR SELECT
  USING (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = todos.company_id AND cm.user_id = auth.uid()));
CREATE POLICY "Company members can create todos" ON todos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = todos.company_id AND cm.user_id = auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Users can update todos" ON todos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = todos.company_id AND cm.user_id = auth.uid()));
CREATE POLICY "Admins can delete todos" ON todos FOR DELETE
  USING (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = todos.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'));

-- =====================================================
-- 6. SIMPLE POLICIES FOR OTHER TABLES
-- =====================================================

-- Todo Assignees
ALTER TABLE todo_assignees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view assignees" ON todo_assignees;
DROP POLICY IF EXISTS "Users can manage assignees" ON todo_assignees;
DROP POLICY IF EXISTS "Users can view assignees of todos they can see" ON todo_assignees;
DROP POLICY IF EXISTS "Todo creators and admins can assign users" ON todo_assignees;
DROP POLICY IF EXISTS "Todo creators and admins can remove assignees" ON todo_assignees;
CREATE POLICY "Users can view assignees" ON todo_assignees FOR SELECT USING (true);
CREATE POLICY "Users can manage assignees" ON todo_assignees FOR ALL USING (true);

-- Subtasks
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view subtasks" ON subtasks;
DROP POLICY IF EXISTS "Users can manage subtasks" ON subtasks;
DROP POLICY IF EXISTS "Users can view subtasks of todos they can see" ON subtasks;
DROP POLICY IF EXISTS "Users with write access can create subtasks" ON subtasks;
DROP POLICY IF EXISTS "Users can update subtasks with proper permissions" ON subtasks;
DROP POLICY IF EXISTS "Admins and creators can delete subtasks" ON subtasks;
CREATE POLICY "Users can view subtasks" ON subtasks FOR SELECT USING (true);
CREATE POLICY "Users can manage subtasks" ON subtasks FOR ALL USING (true);

-- Subtask Assignees
ALTER TABLE subtask_assignees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view subtask assignees" ON subtask_assignees;
DROP POLICY IF EXISTS "Users can manage subtask assignees" ON subtask_assignees;
DROP POLICY IF EXISTS "Subtask creators can assign users" ON subtask_assignees;
DROP POLICY IF EXISTS "Subtask creators can remove assignees" ON subtask_assignees;
CREATE POLICY "Users can view subtask assignees" ON subtask_assignees FOR SELECT USING (true);
CREATE POLICY "Users can manage subtask assignees" ON subtask_assignees FOR ALL USING (true);

-- Comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Users can view comments on todos they can see" ON comments;
DROP POLICY IF EXISTS "Users can add comments if they have access" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments or admins can delete any" ON comments;
CREATE POLICY "Users can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (user_id = auth.uid());

-- Documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Users can upload documents" ON documents;
DROP POLICY IF EXISTS "Users can update documents" ON documents;
DROP POLICY IF EXISTS "Users can delete documents" ON documents;
DROP POLICY IF EXISTS "Company members can view documents" ON documents;
DROP POLICY IF EXISTS "Company members can upload documents" ON documents;
DROP POLICY IF EXISTS "Document uploaders and admins can update documents" ON documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON documents;
CREATE POLICY "Users can view documents" ON documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = documents.company_id AND cm.user_id = auth.uid()));
CREATE POLICY "Users can upload documents" ON documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = documents.company_id AND cm.user_id = auth.uid()) AND uploaded_by = auth.uid());
CREATE POLICY "Users can update documents" ON documents FOR UPDATE
  USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = documents.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'));
CREATE POLICY "Users can delete documents" ON documents FOR DELETE
  USING (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = documents.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'));

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (user_id = auth.uid());

-- Activity Logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view activity logs" ON activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Company members can view activity logs" ON activity_logs;
CREATE POLICY "Users can view activity logs" ON activity_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = activity_logs.company_id AND cm.user_id = auth.uid()));
CREATE POLICY "System can insert activity logs" ON activity_logs FOR INSERT WITH CHECK (true);

-- Attachments
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view attachments" ON attachments;
DROP POLICY IF EXISTS "Users can upload attachments" ON attachments;
DROP POLICY IF EXISTS "Users can delete attachments" ON attachments;
DROP POLICY IF EXISTS "Users can view attachments of accessible todos/comments" ON attachments;
DROP POLICY IF EXISTS "Users can upload attachments to accessible todos/comments" ON attachments;
DROP POLICY IF EXISTS "Uploaders and admins can delete attachments" ON attachments;
CREATE POLICY "Users can view attachments" ON attachments FOR SELECT USING (true);
CREATE POLICY "Users can upload attachments" ON attachments FOR INSERT WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Users can delete attachments" ON attachments FOR DELETE USING (uploaded_by = auth.uid());

-- Todo Documents
ALTER TABLE todo_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view todo documents" ON todo_documents;
DROP POLICY IF EXISTS "Users can manage todo documents" ON todo_documents;
DROP POLICY IF EXISTS "Users can view todo document links" ON todo_documents;
DROP POLICY IF EXISTS "Todo creators can link documents" ON todo_documents;
DROP POLICY IF EXISTS "Todo creators can unlink documents" ON todo_documents;
CREATE POLICY "Users can view todo documents" ON todo_documents FOR SELECT USING (true);
CREATE POLICY "Users can manage todo documents" ON todo_documents FOR ALL USING (true);

-- Todo Permissions
ALTER TABLE todo_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view permissions" ON todo_permissions;
DROP POLICY IF EXISTS "Users can manage permissions" ON todo_permissions;
DROP POLICY IF EXISTS "Users can view permissions of todos they can see" ON todo_permissions;
DROP POLICY IF EXISTS "Todo creators can set permissions" ON todo_permissions;
CREATE POLICY "Users can view permissions" ON todo_permissions FOR SELECT USING (true);
CREATE POLICY "Users can manage permissions" ON todo_permissions FOR ALL USING (true);

-- Superuser Permissions
ALTER TABLE superuser_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage superuser permissions" ON superuser_permissions;
CREATE POLICY "Admins can manage superuser permissions" ON superuser_permissions FOR ALL USING (true);

-- Push Subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================================================
-- FERTIG!
-- =====================================================
