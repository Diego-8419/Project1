-- RLS Policies OHNE jegliche Rekursion
-- Strategie: Policies verwenden nur direkte Tabellenzugriffe ohne Subqueries auf dieselbe Tabelle

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
-- TODOS POLICIES - Vereinfacht ohne Rekursion
-- ============================================================================

-- SELECT: Nutzt eine Security Definer Function um Rekursion zu vermeiden
CREATE OR REPLACE FUNCTION user_can_view_todo(todo_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  todo_company_id uuid;
  user_role text;
  todo_creator uuid;
BEGIN
  -- Hole Todo Details
  SELECT company_id, created_by INTO todo_company_id, todo_creator
  FROM todos
  WHERE id = todo_id;

  -- Hole User Role in der Firma
  SELECT role INTO user_role
  FROM company_members
  WHERE company_members.user_id = user_can_view_todo.user_id
  AND company_id = todo_company_id;

  -- Kein Mitglied der Firma
  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Admin/GL sehen alles
  IF user_role IN ('admin', 'gl') THEN
    RETURN true;
  END IF;

  -- Creator sieht eigene ToDos
  IF todo_creator = user_can_view_todo.user_id THEN
    RETURN true;
  END IF;

  -- Prüfe ob User Assignee ist
  IF EXISTS (
    SELECT 1 FROM todo_assignees
    WHERE todo_assignees.todo_id = user_can_view_todo.todo_id
    AND todo_assignees.user_id = user_can_view_todo.user_id
  ) THEN
    RETURN true;
  END IF;

  -- Prüfe explizite Berechtigung
  IF EXISTS (
    SELECT 1 FROM todo_permissions
    WHERE todo_permissions.todo_id = user_can_view_todo.todo_id
    AND todo_permissions.user_id = user_can_view_todo.user_id
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE POLICY "Users can view todos based on role"
  ON todos FOR SELECT
  TO authenticated
  USING (user_can_view_todo(id, auth.uid()));

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
        cm.role IN ('admin', 'gl')
        OR todos.created_by = auth.uid()
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
-- TODO ASSIGNEES POLICIES - Einfach, ohne Rekursion
-- ============================================================================

CREATE POLICY "Users can view todo assignees"
  ON todo_assignees FOR SELECT
  TO authenticated
  USING (
    -- Direkte Prüfung ohne Subquery auf todos
    EXISTS (
      SELECT 1 FROM todos t
      INNER JOIN company_members cm ON cm.company_id = t.company_id
      WHERE t.id = todo_assignees.todo_id
      AND cm.user_id = auth.uid()
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
