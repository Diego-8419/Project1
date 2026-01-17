-- Komplette RLS Fix - Alle Policies neu mit korrekter Logik
-- Creator sieht immer eigene ToDos
-- Admin/GL sehen alles
-- Normale User sehen nur zugewiesene

-- Lösche ALLE existierenden Policies komplett
DO $$
BEGIN
    -- Todos
    DROP POLICY IF EXISTS "Users can view todos based on role" ON todos;
    DROP POLICY IF EXISTS "Users can create todos in their companies" ON todos;
    DROP POLICY IF EXISTS "Users can update todos based on role" ON todos;
    DROP POLICY IF EXISTS "Users can delete todos based on role" ON todos;
    DROP POLICY IF EXISTS "Company members can view todos" ON todos;
    DROP POLICY IF EXISTS "Company members can create todos" ON todos;
    DROP POLICY IF EXISTS "Company members can update todos" ON todos;
    DROP POLICY IF EXISTS "Company members can delete todos" ON todos;

    -- Todo Assignees
    DROP POLICY IF EXISTS "Users can view todo assignees" ON todo_assignees;
    DROP POLICY IF EXISTS "Users can create todo assignees" ON todo_assignees;
    DROP POLICY IF EXISTS "Users can delete todo assignees" ON todo_assignees;
    DROP POLICY IF EXISTS "Company members can view todo assignees" ON todo_assignees;
    DROP POLICY IF EXISTS "Company members can create todo assignees" ON todo_assignees;
    DROP POLICY IF EXISTS "Company members can delete todo assignees" ON todo_assignees;

    -- Subtasks
    DROP POLICY IF EXISTS "Users can view subtasks" ON subtasks;
    DROP POLICY IF EXISTS "Users can create subtasks" ON subtasks;
    DROP POLICY IF EXISTS "Users can update subtasks" ON subtasks;
    DROP POLICY IF EXISTS "Users can delete subtasks" ON subtasks;
    DROP POLICY IF EXISTS "Company members can view subtasks" ON subtasks;
    DROP POLICY IF EXISTS "Company members can create subtasks" ON subtasks;
    DROP POLICY IF EXISTS "Company members can update subtasks" ON subtasks;
    DROP POLICY IF EXISTS "Company members can delete subtasks" ON subtasks;

    -- Subtask Assignees
    DROP POLICY IF EXISTS "Users can view subtask assignees" ON subtask_assignees;
    DROP POLICY IF EXISTS "Users can create subtask assignees" ON subtask_assignees;
    DROP POLICY IF EXISTS "Users can delete subtask assignees" ON subtask_assignees;
    DROP POLICY IF EXISTS "Company members can view subtask assignees" ON subtask_assignees;
    DROP POLICY IF EXISTS "Company members can create subtask assignees" ON subtask_assignees;
    DROP POLICY IF EXISTS "Company members can delete subtask assignees" ON subtask_assignees;

    -- Functions
    DROP FUNCTION IF EXISTS user_can_view_todo(uuid, uuid) CASCADE;
    DROP FUNCTION IF EXISTS user_is_admin_or_gl(uuid, uuid) CASCADE;
    DROP FUNCTION IF EXISTS user_is_todo_assignee(uuid, uuid) CASCADE;
END $$;

-- Helper Functions mit verbesserter Fehlerbehandlung
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

  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  RETURN user_role IN ('admin', 'gl');
END;
$$;

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
-- TODOS POLICIES - KORRIGIERTE VERSION
-- ============================================================================

-- SELECT: Creator sieht IMMER eigene, Admin/GL sehen alles, Assignees sehen zugewiesene
CREATE POLICY "Users can view todos based on role"
  ON todos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE user_id = auth.uid()
      AND company_id = todos.company_id
    )
    AND (
      todos.created_by = auth.uid()
      OR user_is_admin_or_gl(auth.uid(), todos.company_id)
      OR user_is_todo_assignee(auth.uid(), todos.id)
    )
  );

-- INSERT: JEDER Firmenmitglied kann ToDos erstellen
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

-- UPDATE: Creator, Admin/GL und Assignees können bearbeiten
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
      todos.created_by = auth.uid()
      OR user_is_admin_or_gl(auth.uid(), todos.company_id)
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

-- DELETE: Nur Admin/GL oder Creator
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
      todos.created_by = auth.uid()
      OR user_is_admin_or_gl(auth.uid(), todos.company_id)
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
        t.created_by = auth.uid()
        OR user_is_admin_or_gl(auth.uid(), t.company_id)
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
        t.created_by = auth.uid()
        OR user_is_admin_or_gl(auth.uid(), t.company_id)
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
        t.created_by = auth.uid()
        OR user_is_admin_or_gl(auth.uid(), t.company_id)
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
        t.created_by = auth.uid()
        OR user_is_admin_or_gl(auth.uid(), t.company_id)
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
        t.created_by = auth.uid()
        OR user_is_admin_or_gl(auth.uid(), t.company_id)
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
        t.created_by = auth.uid()
        OR user_is_admin_or_gl(auth.uid(), t.company_id)
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
        t.created_by = auth.uid()
        OR user_is_admin_or_gl(auth.uid(), t.company_id)
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
        t.created_by = auth.uid()
        OR user_is_admin_or_gl(auth.uid(), t.company_id)
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
        t.created_by = auth.uid()
        OR user_is_admin_or_gl(auth.uid(), t.company_id)
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
        t.created_by = auth.uid()
        OR user_is_admin_or_gl(auth.uid(), t.company_id)
      )
    )
  );
