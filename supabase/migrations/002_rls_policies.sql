-- =====================================================
-- Row Level Security (RLS) Policies
-- Multi-Tenant ToDo Application
-- =====================================================

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is a member of a company
CREATE OR REPLACE FUNCTION is_company_member(
  p_company_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = p_company_id
    AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role in a company
CREATE OR REPLACE FUNCTION get_user_role(
  p_company_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS user_role AS $$
  SELECT role FROM company_members
  WHERE company_id = p_company_id
  AND user_id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- USER PROFILES
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- COMPANIES
-- =====================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view companies they are members of"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = companies.id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create companies"
  ON companies FOR INSERT
  WITH CHECK (true); -- Any authenticated user can create a company

CREATE POLICY "Admins can update their companies"
  ON companies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = companies.id
      AND company_members.user_id = auth.uid()
      AND company_members.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete their companies"
  ON companies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = companies.id
      AND company_members.user_id = auth.uid()
      AND company_members.role = 'admin'
    )
  );

-- =====================================================
-- COMPANY MEMBERS
-- =====================================================

ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their companies"
  ON company_members FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company creators can add first member (themselves)"
  ON company_members FOR INSERT
  WITH CHECK (
    -- Allow if this is the first member (creator)
    NOT EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_members.company_id
    )
    AND user_id = auth.uid()
    AND role = 'admin'
  );

CREATE POLICY "Admins can add members to their companies"
  ON company_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_members.company_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

CREATE POLICY "Admins can update member roles"
  ON company_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_members.company_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

CREATE POLICY "Admins can remove members"
  ON company_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_members.company_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

-- =====================================================
-- TODOS
-- =====================================================

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view todos in their companies"
  ON todos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = todos.company_id
      AND cm.user_id = auth.uid()
      AND (
        -- Admin or GL can see all todos
        cm.role IN ('admin', 'gl')
        -- OR user created the todo
        OR todos.created_by = auth.uid()
        -- OR user is assigned to the todo
        OR EXISTS (
          SELECT 1 FROM todo_assignees ta
          WHERE ta.todo_id = todos.id
          AND ta.user_id = auth.uid()
        )
        -- OR user has explicit permission
        OR EXISTS (
          SELECT 1 FROM todo_permissions tp
          WHERE tp.todo_id = todos.id
          AND tp.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Company members can create todos"
  ON todos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = todos.company_id
      AND cm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update todos with proper permissions"
  ON todos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = todos.company_id
      AND cm.user_id = auth.uid()
      AND (
        -- Admin or GL can update all todos
        cm.role IN ('admin', 'gl')
        -- OR creator can update their todo
        OR todos.created_by = auth.uid()
        -- OR user has full_access permission
        OR EXISTS (
          SELECT 1 FROM todo_permissions tp
          WHERE tp.todo_id = todos.id
          AND tp.user_id = auth.uid()
          AND tp.permission_level = 'full_access'
        )
        -- OR user is assignee and can change status (comment_only permission)
        OR (
          EXISTS (
            SELECT 1 FROM todo_assignees ta
            WHERE ta.todo_id = todos.id
            AND ta.user_id = auth.uid()
          )
          AND (
            SELECT permission_level FROM todo_permissions
            WHERE todo_id = todos.id AND user_id = auth.uid()
          ) = 'comment_only'
        )
      )
    )
  );

CREATE POLICY "Only admins can delete todos"
  ON todos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = todos.company_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

-- =====================================================
-- TODO ASSIGNEES
-- =====================================================

ALTER TABLE todo_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assignees of todos they can see"
  ON todo_assignees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      WHERE t.id = todo_assignees.todo_id
      -- RLS on todos table handles visibility
    )
  );

CREATE POLICY "Todo creators and admins can assign users"
  ON todo_assignees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM todos t
      JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = todo_assignees.todo_id
      AND (
        t.created_by = auth.uid()
        OR cm.role IN ('admin', 'gl')
      )
    )
  );

CREATE POLICY "Todo creators and admins can remove assignees"
  ON todo_assignees FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = todo_assignees.todo_id
      AND (
        t.created_by = auth.uid()
        OR cm.role IN ('admin', 'gl')
      )
    )
  );

-- =====================================================
-- TODO PERMISSIONS
-- =====================================================

ALTER TABLE todo_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view permissions of todos they can see"
  ON todo_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      WHERE t.id = todo_permissions.todo_id
    )
  );

CREATE POLICY "Todo creators can set permissions"
  ON todo_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      WHERE t.id = todo_permissions.todo_id
      AND t.created_by = auth.uid()
    )
  );

-- =====================================================
-- SUBTASKS
-- =====================================================

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subtasks of todos they can see"
  ON subtasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      WHERE t.id = subtasks.todo_id
    )
  );

CREATE POLICY "Users with write access can create subtasks"
  ON subtasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM todos t
      JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = subtasks.todo_id
      AND cm.user_id = auth.uid()
      AND (
        cm.role IN ('admin', 'gl')
        OR t.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM todo_permissions tp
          WHERE tp.todo_id = t.id
          AND tp.user_id = auth.uid()
          AND tp.permission_level = 'full_access'
        )
      )
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update subtasks with proper permissions"
  ON subtasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = subtasks.todo_id
      AND cm.user_id = auth.uid()
      AND (
        cm.role IN ('admin', 'gl')
        OR t.created_by = auth.uid()
        OR subtasks.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM subtask_assignees sa
          WHERE sa.subtask_id = subtasks.id
          AND sa.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Admins and creators can delete subtasks"
  ON subtasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = subtasks.todo_id
      AND (
        cm.role = 'admin'
        OR t.created_by = auth.uid()
        OR subtasks.created_by = auth.uid()
      )
    )
  );

-- =====================================================
-- SUBTASK ASSIGNEES
-- =====================================================

ALTER TABLE subtask_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subtask assignees"
  ON subtask_assignees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subtasks st
      JOIN todos t ON t.id = st.todo_id
      WHERE st.id = subtask_assignees.subtask_id
    )
  );

CREATE POLICY "Subtask creators can assign users"
  ON subtask_assignees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subtasks st
      WHERE st.id = subtask_assignees.subtask_id
      AND st.created_by = auth.uid()
    )
  );

CREATE POLICY "Subtask creators can remove assignees"
  ON subtask_assignees FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM subtasks st
      WHERE st.id = subtask_assignees.subtask_id
      AND st.created_by = auth.uid()
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on todos they can see"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      WHERE t.id = comments.todo_id
    )
  );

CREATE POLICY "Users can add comments if they have access"
  ON comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM todos t
      JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = comments.todo_id
      AND cm.user_id = auth.uid()
      AND (
        cm.role IN ('admin', 'gl')
        OR t.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM todo_assignees ta
          WHERE ta.todo_id = t.id AND ta.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM todo_permissions tp
          WHERE tp.todo_id = t.id
          AND tp.user_id = auth.uid()
          AND tp.permission_level IN ('comment_only', 'full_access')
        )
      )
    )
  );

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments or admins can delete any"
  ON comments FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM todos t
      JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = comments.todo_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

-- =====================================================
-- DOCUMENTS
-- =====================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = documents.company_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can upload documents"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = documents.company_id
      AND cm.user_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Document uploaders and admins can update documents"
  ON documents FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = documents.company_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete documents"
  ON documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = documents.company_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

-- =====================================================
-- TODO DOCUMENTS
-- =====================================================

ALTER TABLE todo_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view todo document links"
  ON todo_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      WHERE t.id = todo_documents.todo_id
    )
  );

CREATE POLICY "Todo creators can link documents"
  ON todo_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM todos t
      WHERE t.id = todo_documents.todo_id
      AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "Todo creators can unlink documents"
  ON todo_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      WHERE t.id = todo_documents.todo_id
      AND t.created_by = auth.uid()
    )
  );

-- =====================================================
-- ATTACHMENTS
-- =====================================================

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments of accessible todos/comments"
  ON attachments FOR SELECT
  USING (
    (todo_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM todos t WHERE t.id = attachments.todo_id
    ))
    OR
    (comment_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM comments c
      JOIN todos t ON t.id = c.todo_id
      WHERE c.id = attachments.comment_id
    ))
  );

CREATE POLICY "Users can upload attachments to accessible todos/comments"
  ON attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND (
      (todo_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM todos t
        JOIN company_members cm ON cm.company_id = t.company_id
        WHERE t.id = attachments.todo_id
        AND cm.user_id = auth.uid()
      ))
      OR
      (comment_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM comments c
        WHERE c.id = attachments.comment_id
        AND c.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Uploaders and admins can delete attachments"
  ON attachments FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM todos t
      JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = attachments.todo_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

-- =====================================================
-- ACTIVITY LOGS
-- =====================================================

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view activity logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = activity_logs.company_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true); -- Will be inserted by triggers/functions

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Will be created by the system

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- PUSH SUBSCRIPTIONS
-- =====================================================

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
