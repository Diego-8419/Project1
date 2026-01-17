-- Entferne ALLE Helper Functions und Policies komplett
-- Erstelle nur die einfachsten Policies ohne jegliche Functions

-- Lösche ALLE Functions
DROP FUNCTION IF EXISTS user_can_view_todo(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS user_is_admin_or_gl(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS user_is_todo_assignee(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS user_can_update_todo(uuid, uuid) CASCADE;

-- Lösche ALLE Policies
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
END $$;

-- ============================================================================
-- SUPER EINFACHE POLICIES - NUR COMPANY MEMBERSHIP CHECK
-- ============================================================================

-- TODOS: Alle Firmenmitglieder können alles mit ihren Firmen-ToDos machen
CREATE POLICY "Company members full access to todos"
  ON todos FOR ALL
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

-- TODO ASSIGNEES: Alle Firmenmitglieder können Zuweisungen sehen/ändern
CREATE POLICY "Company members full access to todo assignees"
  ON todo_assignees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = todo_assignees.todo_id
      AND cm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = todo_assignees.todo_id
      AND cm.user_id = auth.uid()
    )
  );

-- SUBTASKS: Alle Firmenmitglieder können Subtasks sehen/ändern
CREATE POLICY "Company members full access to subtasks"
  ON subtasks FOR ALL
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

-- SUBTASK ASSIGNEES: Alle Firmenmitglieder können Subtask-Zuweisungen sehen/ändern
CREATE POLICY "Company members full access to subtask assignees"
  ON subtask_assignees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subtasks s
      INNER JOIN todos t ON t.id = s.todo_id
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE s.id = subtask_assignees.subtask_id
      AND cm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subtasks s
      INNER JOIN todos t ON t.id = s.todo_id
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE s.id = subtask_assignees.subtask_id
      AND cm.user_id = auth.uid()
    )
  );

-- HINWEIS:
-- Diese Policies sind super einfach und sollten KEINE Rekursion verursachen
-- Alle Firmenmitglieder haben vollen Zugriff auf ToDos ihrer Firma
-- Feingranulare Berechtigungen müssen in der App-Logik erfolgen
