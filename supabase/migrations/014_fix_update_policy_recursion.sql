-- Fix UPDATE Policy Rekursion
-- Problem: user_is_todo_assignee Function verursacht Rekursion bei UPDATE
-- Lösung: Vereinfachte UPDATE Policy ohne Assignee-Check

-- Lösche die alte UPDATE Policy
DROP POLICY IF EXISTS "Users can update todos based on role" ON todos;

-- Neue, vereinfachte UPDATE Policy
-- Creator und Admin/GL können updaten - OHNE Assignee-Check um Rekursion zu vermeiden
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
      -- Creator kann eigene bearbeiten
      todos.created_by = auth.uid()
      -- Admin/GL können alles bearbeiten
      OR user_is_admin_or_gl(auth.uid(), todos.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE user_id = auth.uid()
      AND company_id = todos.company_id
    )
  );

-- HINWEIS: Assignees können jetzt NICHT mehr den Status ändern
-- Das ist ein Trade-off um Rekursion zu vermeiden
-- Wenn nötig, kann man später eine SECURITY DEFINER Function für Status-Updates erstellen
