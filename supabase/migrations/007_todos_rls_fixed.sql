-- Korrigierte RLS Policies ohne Rekursion
-- Verwendet direkte Joins statt verschachtelte Subqueries

-- Lösche alle existierenden Policies
DROP POLICY IF EXISTS "Users can view todos based on role" ON todos;
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
-- TODOS POLICIES
-- ============================================================================

CREATE POLICY "Users can view todos based on role"
  ON todos FOR SELECT
  TO authenticated
  USING (
    -- User muss Mitglied der Firma sein
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.user_id = auth.uid()
      AND cm.company_id = todos.company_id
      AND (
        -- Admin/GL sehen alle ToDos
        cm.role IN ('admin', 'gl')
        -- Normale User sehen nur eigene oder zugewiesene
        OR todos.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM todo_assignees ta
          WHERE ta.todo_id = todos.id
          AND ta.user_id = auth.uid()
        )
        -- Oder explizite Berechtigung
        OR EXISTS (
          SELECT 1 FROM todo_permissions tp
          WHERE tp.todo_id = todos.id
          AND tp.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create todos in their companies"
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
      SELECT 1 FROM company_members cm
      WHERE cm.user_id = auth.uid()
      AND cm.company_id = todos.company_id
      AND (
        -- Admin/GL können alle bearbeiten
        cm.role IN ('admin', 'gl')
        -- Creator kann eigene bearbeiten
        OR todos.created_by = auth.uid()
        -- Oder full_access Berechtigung
        OR EXISTS (
          SELECT 1 FROM todo_permissions tp
          WHERE tp.todo_id = todos.id
          AND tp.user_id = auth.uid()
          AND tp.permission_level = 'full_access'
        )
      )
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
      SELECT 1 FROM company_members cm
      WHERE cm.user_id = auth.uid()
      AND cm.company_id = todos.company_id
      AND (
        cm.role IN ('admin', 'gl')
        OR todos.created_by = auth.uid()
      )
    )
  );

-- ============================================================================
-- TODO ASSIGNEES POLICIES (Vereinfacht, keine Rekursion)
-- ============================================================================

CREATE POLICY "Users can view todo assignees"
  ON todo_assignees FOR SELECT
  TO authenticated
  USING (
    -- Kann Assignees sehen, wenn man Mitglied der Firma ist
    -- und entweder Admin/GL oder Creator oder selbst Assignee ist
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = todo_assignees.todo_id
      AND cm.user_id = auth.uid()
      AND (
        cm.role IN ('admin', 'gl')
        OR t.created_by = auth.uid()
        OR todo_assignees.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create todo assignees"
  ON todo_assignees FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Kann Assignees hinzufügen, wenn man Creator oder Admin/GL ist
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = todo_assignees.todo_id
      AND cm.user_id = auth.uid()
      AND (
        cm.role IN ('admin', 'gl')
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
        cm.role IN ('admin', 'gl')
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
        cm.role IN ('admin', 'gl')
        OR t.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM todo_assignees ta
          WHERE ta.todo_id = t.id
          AND ta.user_id = auth.uid()
        )
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
        cm.role IN ('admin', 'gl')
        OR t.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM todo_assignees ta
          WHERE ta.todo_id = t.id
          AND ta.user_id = auth.uid()
        )
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
        cm.role IN ('admin', 'gl')
        OR t.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM todo_assignees ta
          WHERE ta.todo_id = t.id
          AND ta.user_id = auth.uid()
        )
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
        cm.role IN ('admin', 'gl')
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
        cm.role IN ('admin', 'gl')
        OR t.created_by = auth.uid()
        OR subtask_assignees.user_id = auth.uid()
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
        cm.role IN ('admin', 'gl')
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
        cm.role IN ('admin', 'gl')
        OR t.created_by = auth.uid()
      )
    )
  );
