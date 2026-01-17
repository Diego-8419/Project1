-- Rollenbasierte RLS Policies für ToDos
-- GL/Admin sehen alle ToDos ihrer Firma
-- Normale User sehen nur ToDos, die sie erstellt haben oder wo sie zugewiesen sind

-- Lösche alte Policies
DROP POLICY IF EXISTS "Users can view todos in their companies" ON todos;
DROP POLICY IF EXISTS "Users can create todos in their companies" ON todos;
DROP POLICY IF EXISTS "Users can update todos in their companies" ON todos;
DROP POLICY IF EXISTS "Users can delete todos in their companies" ON todos;

-- Neue Todos Policies mit Rollenbeschränkung
CREATE POLICY "Users can view todos based on role"
  ON todos FOR SELECT
  TO authenticated
  USING (
    -- Prüfe ob User Mitglied der Firma ist
    company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
    AND (
      -- Admin/GL sehen alle ToDos
      EXISTS (
        SELECT 1 FROM company_members
        WHERE user_id = auth.uid()
        AND company_id = todos.company_id
        AND role IN ('admin', 'gl')
      )
      -- Normale User sehen nur eigene oder zugewiesene ToDos
      OR created_by = auth.uid()
      OR id IN (
        SELECT todo_id FROM todo_assignees WHERE user_id = auth.uid()
      )
      -- Oder explizite Berechtigung in todo_permissions
      OR id IN (
        SELECT todo_id FROM todo_permissions WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create todos in their companies"
  ON todos FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update todos based on role"
  ON todos FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
    AND (
      -- Admin/GL können alle ToDos bearbeiten
      EXISTS (
        SELECT 1 FROM company_members
        WHERE user_id = auth.uid()
        AND company_id = todos.company_id
        AND role IN ('admin', 'gl')
      )
      -- Creator kann eigene ToDos bearbeiten
      OR created_by = auth.uid()
      -- Assignees mit full_access können bearbeiten
      OR id IN (
        SELECT todo_id FROM todo_permissions
        WHERE user_id = auth.uid()
        AND permission_level = 'full_access'
      )
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete todos based on role"
  ON todos FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
    AND (
      -- Nur Admin/GL oder Creator können löschen
      EXISTS (
        SELECT 1 FROM company_members
        WHERE user_id = auth.uid()
        AND company_id = todos.company_id
        AND role IN ('admin', 'gl')
      )
      OR created_by = auth.uid()
    )
  );

-- Todo Assignees Policies (basierend auf Todo-Zugriff)
DROP POLICY IF EXISTS "Users can view todo assignees" ON todo_assignees;
DROP POLICY IF EXISTS "Users can create todo assignees" ON todo_assignees;
DROP POLICY IF EXISTS "Users can delete todo assignees" ON todo_assignees;

CREATE POLICY "Users can view todo assignees"
  ON todo_assignees FOR SELECT
  TO authenticated
  USING (
    -- Kann Assignees sehen, wenn man das ToDo sehen kann
    todo_id IN (
      SELECT id FROM todos WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
      AND (
        EXISTS (
          SELECT 1 FROM company_members
          WHERE user_id = auth.uid()
          AND company_id = todos.company_id
          AND role IN ('admin', 'gl')
        )
        OR created_by = auth.uid()
        OR id IN (SELECT todo_id FROM todo_assignees WHERE user_id = auth.uid())
        OR id IN (SELECT todo_id FROM todo_permissions WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can create todo assignees"
  ON todo_assignees FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Kann Assignees hinzufügen, wenn man das ToDo bearbeiten kann
    todo_id IN (
      SELECT id FROM todos WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
      AND (
        EXISTS (
          SELECT 1 FROM company_members
          WHERE user_id = auth.uid()
          AND company_id = todos.company_id
          AND role IN ('admin', 'gl')
        )
        OR created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete todo assignees"
  ON todo_assignees FOR DELETE
  TO authenticated
  USING (
    todo_id IN (
      SELECT id FROM todos WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
      AND (
        EXISTS (
          SELECT 1 FROM company_members
          WHERE user_id = auth.uid()
          AND company_id = todos.company_id
          AND role IN ('admin', 'gl')
        )
        OR created_by = auth.uid()
      )
    )
  );

-- Subtasks Policies (basierend auf Todo-Zugriff)
DROP POLICY IF EXISTS "Users can view subtasks" ON subtasks;
DROP POLICY IF EXISTS "Users can create subtasks" ON subtasks;
DROP POLICY IF EXISTS "Users can update subtasks" ON subtasks;
DROP POLICY IF EXISTS "Users can delete subtasks" ON subtasks;

CREATE POLICY "Users can view subtasks"
  ON subtasks FOR SELECT
  TO authenticated
  USING (
    todo_id IN (
      SELECT id FROM todos WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
      AND (
        EXISTS (
          SELECT 1 FROM company_members
          WHERE user_id = auth.uid()
          AND company_id = todos.company_id
          AND role IN ('admin', 'gl')
        )
        OR created_by = auth.uid()
        OR id IN (SELECT todo_id FROM todo_assignees WHERE user_id = auth.uid())
        OR id IN (SELECT todo_id FROM todo_permissions WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can create subtasks"
  ON subtasks FOR INSERT
  TO authenticated
  WITH CHECK (
    todo_id IN (
      SELECT id FROM todos WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
      AND (
        EXISTS (
          SELECT 1 FROM company_members
          WHERE user_id = auth.uid()
          AND company_id = todos.company_id
          AND role IN ('admin', 'gl')
        )
        OR created_by = auth.uid()
        OR id IN (SELECT todo_id FROM todo_assignees WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can update subtasks"
  ON subtasks FOR UPDATE
  TO authenticated
  USING (
    todo_id IN (
      SELECT id FROM todos WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
      AND (
        EXISTS (
          SELECT 1 FROM company_members
          WHERE user_id = auth.uid()
          AND company_id = todos.company_id
          AND role IN ('admin', 'gl')
        )
        OR created_by = auth.uid()
        OR id IN (SELECT todo_id FROM todo_assignees WHERE user_id = auth.uid())
      )
    )
  )
  WITH CHECK (
    todo_id IN (
      SELECT id FROM todos WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete subtasks"
  ON subtasks FOR DELETE
  TO authenticated
  USING (
    todo_id IN (
      SELECT id FROM todos WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
      AND (
        EXISTS (
          SELECT 1 FROM company_members
          WHERE user_id = auth.uid()
          AND company_id = todos.company_id
          AND role IN ('admin', 'gl')
        )
        OR created_by = auth.uid()
      )
    )
  );

-- Subtask Assignees Policies
DROP POLICY IF EXISTS "Users can view subtask assignees" ON subtask_assignees;
DROP POLICY IF EXISTS "Users can create subtask assignees" ON subtask_assignees;
DROP POLICY IF EXISTS "Users can delete subtask assignees" ON subtask_assignees;

CREATE POLICY "Users can view subtask assignees"
  ON subtask_assignees FOR SELECT
  TO authenticated
  USING (
    subtask_id IN (
      SELECT id FROM subtasks WHERE todo_id IN (
        SELECT id FROM todos WHERE company_id IN (
          SELECT company_id FROM company_members WHERE user_id = auth.uid()
        )
        AND (
          EXISTS (
            SELECT 1 FROM company_members
            WHERE user_id = auth.uid()
            AND company_id = todos.company_id
            AND role IN ('admin', 'gl')
          )
          OR created_by = auth.uid()
          OR id IN (SELECT todo_id FROM todo_assignees WHERE user_id = auth.uid())
          OR id IN (SELECT todo_id FROM todo_permissions WHERE user_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Users can create subtask assignees"
  ON subtask_assignees FOR INSERT
  TO authenticated
  WITH CHECK (
    subtask_id IN (
      SELECT id FROM subtasks WHERE todo_id IN (
        SELECT id FROM todos WHERE company_id IN (
          SELECT company_id FROM company_members WHERE user_id = auth.uid()
        )
        AND (
          EXISTS (
            SELECT 1 FROM company_members
            WHERE user_id = auth.uid()
            AND company_id = todos.company_id
            AND role IN ('admin', 'gl')
          )
          OR created_by = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete subtask assignees"
  ON subtask_assignees FOR DELETE
  TO authenticated
  USING (
    subtask_id IN (
      SELECT id FROM subtasks WHERE todo_id IN (
        SELECT id FROM todos WHERE company_id IN (
          SELECT company_id FROM company_members WHERE user_id = auth.uid()
        )
        AND (
          EXISTS (
            SELECT 1 FROM company_members
            WHERE user_id = auth.uid()
            AND company_id = todos.company_id
            AND role IN ('admin', 'gl')
          )
          OR created_by = auth.uid()
        )
      )
    )
  );
