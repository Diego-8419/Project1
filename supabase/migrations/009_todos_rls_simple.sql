-- Vereinfachte RLS Policies - Alle Firmenmitglieder sehen alle ToDos ihrer Firma
-- Feingranulare Berechtigungen werden später in der Applikation gehandhabt

-- Lösche alte Function und Policies
DROP POLICY IF EXISTS "Users can view todos based on role" ON todos;

DROP FUNCTION IF EXISTS user_can_view_todo(uuid, uuid) CASCADE;
DROP POLICY IF EXISTS "Users can create todos in their companies" ON todos;
DROP POLICY IF EXISTS "Users can update todos based on role" ON todos;
DROP POLICY IF EXISTS "Users can delete todos based on role" ON todos;

DROP POLICY IF EXISTS "Users can view todo assignees" ON todo_assignees;
DROP POLICY IF EXISTS "Users can create todo assignees" ON todo_assignees;
DROP POLICY IF EXISTS "Users can delete todo assignees" ON todo_assignees;

DROP POLICY IF EXISTS "Users can view subtasks" ON subtasks;
DROP POLICY IF EXISTS "Users can create subtasks" ON subtasks;
DROP POLICY IF EXISTS "Users can update subtasks" ON subtasks;
DROP POLICY IF EXISTS "Users can delete subtasks" ON subtasks;

DROP POLICY IF EXISTS "Users can view subtask assignees" ON subtask_assignees;
DROP POLICY IF EXISTS "Users can create subtask assignees" ON subtask_assignees;
DROP POLICY IF EXISTS "Users can delete subtask assignees" ON subtask_assignees;

-- ============================================================================
-- TODOS POLICIES - Einfach: Alle Mitglieder sehen alle ToDos ihrer Firma
-- ============================================================================

CREATE POLICY "Company members can view todos"
  ON todos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.user_id = auth.uid()
      AND company_members.company_id = todos.company_id
    )
  );

CREATE POLICY "Company members can create todos"
  ON todos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.user_id = auth.uid()
      AND company_members.company_id = todos.company_id
    )
  );

CREATE POLICY "Company members can update todos"
  ON todos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.user_id = auth.uid()
      AND company_members.company_id = todos.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.user_id = auth.uid()
      AND company_members.company_id = todos.company_id
    )
  );

CREATE POLICY "Company members can delete todos"
  ON todos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.user_id = auth.uid()
      AND cm.company_id = todos.company_id
      AND (
        -- Nur Admin/GL oder Creator kann löschen
        cm.role IN ('admin', 'gl')
        OR todos.created_by = auth.uid()
      )
    )
  );

-- ============================================================================
-- TODO ASSIGNEES POLICIES
-- ============================================================================

CREATE POLICY "Company members can view todo assignees"
  ON todo_assignees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = todo_assignees.todo_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can create todo assignees"
  ON todo_assignees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = todo_assignees.todo_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can delete todo assignees"
  ON todo_assignees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = todo_assignees.todo_id
      AND cm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SUBTASKS POLICIES
-- ============================================================================

CREATE POLICY "Company members can view subtasks"
  ON subtasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = subtasks.todo_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can create subtasks"
  ON subtasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = subtasks.todo_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can update subtasks"
  ON subtasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = subtasks.todo_id
      AND cm.user_id = auth.uid()
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

CREATE POLICY "Company members can delete subtasks"
  ON subtasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = subtasks.todo_id
      AND cm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SUBTASK ASSIGNEES POLICIES
-- ============================================================================

CREATE POLICY "Company members can view subtask assignees"
  ON subtask_assignees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subtasks s
      INNER JOIN todos t ON t.id = s.todo_id
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE s.id = subtask_assignees.subtask_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can create subtask assignees"
  ON subtask_assignees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subtasks s
      INNER JOIN todos t ON t.id = s.todo_id
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE s.id = subtask_assignees.subtask_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can delete subtask assignees"
  ON subtask_assignees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subtasks s
      INNER JOIN todos t ON t.id = s.todo_id
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE s.id = subtask_assignees.subtask_id
      AND cm.user_id = auth.uid()
    )
  );
