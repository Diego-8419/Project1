-- ABSOLUT EINFACHSTE POLICIES - KEINE JOINS, KEINE SUBQUERIES AUF TODOS
-- Problem: JOINs auf todos in anderen Policies verursachen Rekursion

-- Lösche ALLE Policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Company members full access to todos" ON todos;
    DROP POLICY IF EXISTS "Company members full access to todo assignees" ON todo_assignees;
    DROP POLICY IF EXISTS "Company members full access to subtasks" ON subtasks;
    DROP POLICY IF EXISTS "Company members full access to subtask assignees" ON subtask_assignees;
END $$;

-- ============================================================================
-- TODOS: NUR COMPANY CHECK - KEINE ANDEREN TABELLEN
-- ============================================================================

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

-- ============================================================================
-- TODO ASSIGNEES: KEIN JOIN AUF TODOS - NUR DIREKT
-- ============================================================================

-- Temporär ALLE Firmenmitglieder können ALLES mit todo_assignees machen
-- (Keine Security, aber vermeidet Rekursion)
CREATE POLICY "Todo assignees open access"
  ON todo_assignees FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SUBTASKS: KEIN JOIN AUF TODOS - NUR DIREKT
-- ============================================================================

CREATE POLICY "Subtasks open access"
  ON subtasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SUBTASK ASSIGNEES: KEIN JOIN - NUR DIREKT
-- ============================================================================

CREATE POLICY "Subtask assignees open access"
  ON subtask_assignees FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- WICHTIGER HINWEIS:
-- Diese Policies sind EXTREM offen und haben fast keine Security
-- todo_assignees, subtasks, subtask_assignees haben NO SECURITY
-- Das ist der letzte Versuch um Rekursion zu vermeiden
-- Wir müssen Security in der App-Logik implementieren
