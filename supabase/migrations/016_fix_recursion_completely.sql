-- Kompletter Fix der Rekursion
-- Problem: Auch SECURITY DEFINER Functions werden von anderen Policies getroffen
-- Lösung: Vereinfache alle Policies komplett, keine cross-table checks

-- Lösche ALLE ToDo-bezogenen Policies
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

    -- Functions
    DROP FUNCTION IF EXISTS user_can_update_todo(uuid, uuid) CASCADE;
END $$;

-- ============================================================================
-- NEUE VEREINFACHTE POLICIES - KEINE REKURSION
-- ============================================================================

-- SELECT: Alle Firmenmitglieder sehen alle ToDos ihrer Firma
-- (Filterung nach Creator/Assignee erfolgt in der App)
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

-- INSERT: Alle Firmenmitglieder können ToDos erstellen
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

-- UPDATE: Alle Firmenmitglieder können alle ToDos ihrer Firma updaten
-- (Feingranulare Berechtigungen erfolgen in der App-Logik)
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

-- DELETE: Nur Admin/GL oder Creator können löschen
CREATE POLICY "Company members can delete todos"
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

-- HINWEIS:
-- Alle Firmenmitglieder können jetzt alle ToDos ihrer Firma sehen und updaten
-- Feingranulare Berechtigungen (nur eigene/zugewiesene) müssen in der App-Logik erfolgen
-- Das ist ein Trade-off um Rekursion komplett zu vermeiden
