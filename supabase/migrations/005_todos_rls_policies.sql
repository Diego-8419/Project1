-- RLS Policies für ToDos
-- Ermöglicht Firmenmitgliedern Zugriff auf ToDos ihrer Firma

-- Lösche existierende Policies
DROP POLICY IF EXISTS "Users can view todos in their companies" ON todos;
DROP POLICY IF EXISTS "Users can create todos in their companies" ON todos;
DROP POLICY IF EXISTS "Users can update todos in their companies" ON todos;
DROP POLICY IF EXISTS "Users can delete todos in their companies" ON todos;

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

-- Todos Policies
CREATE POLICY "Users can view todos in their companies"
  ON todos FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
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

CREATE POLICY "Users can update todos in their companies"
  ON todos FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete todos in their companies"
  ON todos FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

-- Todo Assignees Policies
CREATE POLICY "Users can view todo assignees"
  ON todo_assignees FOR SELECT
  TO authenticated
  USING (
    todo_id IN (
      SELECT id FROM todos WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create todo assignees"
  ON todo_assignees FOR INSERT
  TO authenticated
  WITH CHECK (
    todo_id IN (
      SELECT id FROM todos WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
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
    )
  );

-- Subtasks Policies
CREATE POLICY "Users can view subtasks"
  ON subtasks FOR SELECT
  TO authenticated
  USING (
    todo_id IN (
      SELECT id FROM todos WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
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
    )
  );

-- Subtask Assignees Policies
CREATE POLICY "Users can view subtask assignees"
  ON subtask_assignees FOR SELECT
  TO authenticated
  USING (
    subtask_id IN (
      SELECT id FROM subtasks WHERE todo_id IN (
        SELECT id FROM todos WHERE company_id IN (
          SELECT company_id FROM company_members WHERE user_id = auth.uid()
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
      )
    )
  );
