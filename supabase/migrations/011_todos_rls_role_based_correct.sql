-- Rollenbasierte RLS Policies
-- Admin/GL sehen alle ToDos ihrer Firma
-- Normale User sehen nur eigene oder zugewiesene ToDos
-- WICHTIG: Verwendet SECURITY DEFINER Function um Rekursion zu vermeiden

-- Lösche alle existierenden Policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view todos based on role" ON todos;
    DROP POLICY IF EXISTS "Users can create todos in their companies" ON todos;
    DROP POLICY IF EXISTS "Users can update todos based on role" ON todos;
    DROP POLICY IF EXISTS "Users can delete todos based on role" ON todos;
    DROP POLICY IF EXISTS "Company members can view todos" ON todos;
    DROP POLICY IF EXISTS "Company members can create todos" ON todos;
    DROP POLICY IF EXISTS "Company members can update todos" ON todos;
    DROP POLICY IF EXISTS "Company members can delete todos" ON todos;

    DROP POLICY IF EXISTS "Users can view todo assignees" ON todo_assignees;
    DROP POLICY IF EXISTS "Users can create todo assignees" ON todo_assignees;
    DROP POLICY IF EXISTS "Users can delete todo assignees" ON todo_assignees;
    DROP POLICY IF EXISTS "Company members can view todo assignees" ON todo_assignees;
    DROP POLICY IF EXISTS "Company members can create todo assignees" ON todo_assignees;
    DROP POLICY IF EXISTS "Company members can delete todo assignees" ON todo_assignees;

    DROP POLICY IF EXISTS "Users can view subtasks" ON subtasks;
    DROP POLICY IF EXISTS "Users can create subtasks" ON subtasks;
    DROP POLICY IF EXISTS "Users can update subtasks" ON subtasks;
    DROP POLICY IF EXISTS "Users can delete subtasks" ON subtasks;
    DROP POLICY IF EXISTS "Company members can view subtasks" ON subtasks;
    DROP POLICY IF EXISTS "Company members can create subtasks" ON subtasks;
    DROP POLICY IF EXISTS "Company members can update subtasks" ON subtasks;
    DROP POLICY IF EXISTS "Company members can delete subtasks" ON subtasks;

    DROP POLICY IF EXISTS "Users can view subtask assignees" ON subtask_assignees;
    DROP POLICY IF EXISTS "Users can create subtask assignees" ON subtask_assignees;
    DROP POLICY IF EXISTS "Users can delete subtask assignees" ON subtask_assignees;
    DROP POLICY IF EXISTS "Company members can view subtask assignees" ON subtask_assignees;
    DROP POLICY IF EXISTS "Company members can create subtask assignees" ON subtask_assignees;
    DROP POLICY IF EXISTS "Company members can delete subtask assignees" ON subtask_assignees;

    DROP FUNCTION IF EXISTS user_can_view_todo(uuid, uuid) CASCADE;
    DROP FUNCTION IF EXISTS user_is_admin_or_gl(uuid, uuid) CASCADE;
    DROP FUNCTION IF EXISTS user_is_todo_assignee(uuid, uuid) CASCADE;
END $$;

-- Helper Function: Prüfe ob User Admin oder GL in der Firma ist
CREATE OR REPLACE FUNCTION user_is_admin_or_gl(p_user_id uuid, p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM company_members
  WHERE user_id = p_user_id
  AND company_id = p_company_id;

  RETURN user_role IN ('admin', 'gl');
END;
$$;

-- Helper Function: Prüfe ob User einem ToDo zugewiesen ist
CREATE OR REPLACE FUNCTION user_is_todo_assignee(p_user_id uuid, p_todo_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM todo_assignees
    WHERE user_id = p_user_id
    AND todo_id = p_todo_id
  );
END;
$$;

-- ============================================================================
-- TODOS POLICIES
-- ============================================================================

CREATE POLICY "Users can view todos based on role"
  ON todos FOR SELECT
  TO authenticated
  USING (
    -- User muss Mitglied der Firma sein
    EXISTS (
      SELECT 1 FROM company_members
      WHERE user_id = auth.uid()
      AND company_id = todos.company_id
    )
    AND (
      -- Admin/GL sehen alles
      user_is_admin_or_gl(auth.uid(), todos.company_id)
      -- Creator sieht eigene
      OR todos.created_by = auth.uid()
      -- Assignee sieht zugewiesene
      OR user_is_todo_assignee(auth.uid(), todos.id)
    )
  );

CREATE POLICY "Company members can create todos"
  ON todos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE user_id = auth.uid()
      AND company_id = todos.company_id
    )
  );

CREATE POLICY "Users can update todos based on role"
  ON todos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE user_id = auth.uid()
      AND company_id = todos.company_id
    )
    AND (
      -- Admin/GL können alles bearbeiten
      user_is_admin_or_gl(auth.uid(), todos.company_id)
      -- Creator kann eigene bearbeiten
      OR todos.created_by = auth.uid()
      -- Assignees können zugewiesene bearbeiten
      OR user_is_todo_assignee(auth.uid(), todos.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE user_id = auth.uid()
      AND company_id = todos.company_id
    )
  );

CREATE POLICY "Users can delete todos based on role"
  ON todos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE user_id = auth.uid()
      AND company_id = todos.company_id
    )
    AND (
      -- Nur Admin/GL oder Creator können löschen
      user_is_admin_or_gl(auth.uid(), todos.company_id)
      OR todos.created_by = auth.uid()
    )
  );

-- ============================================================================
-- TODO ASSIGNEES POLICIES
-- ============================================================================

CREATE POLICY "Users can view todo assignees"
  ON todo_assignees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = todo_assignees.todo_id
      AND cm.user_id = auth.uid()
      AND (
        -- Admin/GL sehen alles
        user_is_admin_or_gl(auth.uid(), t.company_id)
        -- Creator sieht Assignees seiner ToDos
        OR t.created_by = auth.uid()
        -- Assignees sehen andere Assignees
        OR user_is_todo_assignee(auth.uid(), t.id)
      )
    )
  );

CREATE POLICY "Users can create todo assignees"
  ON todo_assignees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = todo_assignees.todo_id
      AND cm.user_id = auth.uid()
      AND (
        -- Admin/GL können jedem zuweisen
        user_is_admin_or_gl(auth.uid(), t.company_id)
        -- Creator kann zuweisen
        OR t.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete todo assignees"
  ON todo_assignees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = todo_assignees.todo_id
      AND cm.user_id = auth.uid()
      AND (
        -- Admin/GL können Zuweisungen entfernen
        user_is_admin_or_gl(auth.uid(), t.company_id)
        -- Creator kann Zuweisungen entfernen
        OR t.created_by = auth.uid()
      )
    )
  );

-- ============================================================================
-- SUBTASKS POLICIES
-- ============================================================================

CREATE POLICY "Users can view subtasks"
  ON subtasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = subtasks.todo_id
      AND cm.user_id = auth.uid()
      AND (
        user_is_admin_or_gl(auth.uid(), t.company_id)
        OR t.created_by = auth.uid()
        OR user_is_todo_assignee(auth.uid(), t.id)
      )
    )
  );

CREATE POLICY "Users can create subtasks"
  ON subtasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = subtasks.todo_id
      AND cm.user_id = auth.uid()
      AND (
        user_is_admin_or_gl(auth.uid(), t.company_id)
        OR t.created_by = auth.uid()
        OR user_is_todo_assignee(auth.uid(), t.id)
      )
    )
  );

CREATE POLICY "Users can update subtasks"
  ON subtasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = subtasks.todo_id
      AND cm.user_id = auth.uid()
      AND (
        user_is_admin_or_gl(auth.uid(), t.company_id)
        OR t.created_by = auth.uid()
        OR user_is_todo_assignee(auth.uid(), t.id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = subtasks.todo_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete subtasks"
  ON subtasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = subtasks.todo_id
      AND cm.user_id = auth.uid()
      AND (
        user_is_admin_or_gl(auth.uid(), t.company_id)
        OR t.created_by = auth.uid()
      )
    )
  );

-- ============================================================================
-- SUBTASK ASSIGNEES POLICIES
-- ============================================================================

CREATE POLICY "Users can view subtask assignees"
  ON subtask_assignees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subtasks s
      INNER JOIN todos t ON t.id = s.todo_id
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE s.id = subtask_assignees.subtask_id
      AND cm.user_id = auth.uid()
      AND (
        user_is_admin_or_gl(auth.uid(), t.company_id)
        OR t.created_by = auth.uid()
        OR user_is_todo_assignee(auth.uid(), t.id)
      )
    )
  );

CREATE POLICY "Users can create subtask assignees"
  ON subtask_assignees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subtasks s
      INNER JOIN todos t ON t.id = s.todo_id
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE s.id = subtask_assignees.subtask_id
      AND cm.user_id = auth.uid()
      AND (
        user_is_admin_or_gl(auth.uid(), t.company_id)
        OR t.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete subtask assignees"
  ON subtask_assignees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subtasks s
      INNER JOIN todos t ON t.id = s.todo_id
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE s.id = subtask_assignees.subtask_id
      AND cm.user_id = auth.uid()
      AND (
        user_is_admin_or_gl(auth.uid(), t.company_id)
        OR t.created_by = auth.uid()
      )
    )
  );
