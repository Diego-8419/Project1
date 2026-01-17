-- Debug und Fix: Creator sollte eigene ToDos immer sehen können
-- Problem: Creator sieht ToDos nicht, auch wenn er sie erstellt hat

-- Teste die Helper Functions
-- Du kannst diese Queries einzeln in Supabase SQL Editor ausführen um zu debuggen:

-- 1. Zeige alle company_members (um deine Rolle zu sehen)
-- SELECT * FROM company_members WHERE user_id = auth.uid();

-- 2. Zeige alle ToDos (ohne RLS, nur für Debug)
-- SELECT id, title, created_by, company_id FROM todos;

-- 3. Teste user_is_admin_or_gl Function
-- SELECT user_is_admin_or_gl(auth.uid(), 'deine-company-id'::uuid);

-- 4. Zeige alle todo_assignees
-- SELECT * FROM todo_assignees;

-- Das eigentliche Problem: Die View Policy hat einen Logikfehler
-- Der Creator sollte IMMER seine eigenen ToDos sehen, OHNE dass die Admin-Check zuerst kommt

-- Lösche die alte View Policy
DROP POLICY IF EXISTS "Users can view todos based on role" ON todos;

-- Erstelle neue, korrigierte View Policy
-- WICHTIG: Creator-Check MUSS funktionieren, auch ohne Admin-Rechte
CREATE POLICY "Users can view todos based on role"
  ON todos FOR SELECT
  TO authenticated
  USING (
    -- User muss Mitglied der Firma sein
    EXISTS (
      SELECT 1 FROM company_members
      WHERE user_id = auth.uid()
      AND company_id = todos.company_id
    )
    AND (
      -- WICHTIG: Creator sieht IMMER eigene ToDos (erster Check!)
      todos.created_by = auth.uid()
      -- ODER: Admin/GL sehen alles
      OR user_is_admin_or_gl(auth.uid(), todos.company_id)
      -- ODER: Assignee sieht zugewiesene
      OR user_is_todo_assignee(auth.uid(), todos.id)
    )
  );

-- Zusätzlich: Stelle sicher, dass die Helper Functions korrekt sind
-- Erstelle sie neu mit verbesserter Fehlerbehandlung

DROP FUNCTION IF EXISTS user_is_admin_or_gl(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS user_is_todo_assignee(uuid, uuid) CASCADE;

-- Verbesserte Admin/GL Check Function
CREATE OR REPLACE FUNCTION user_is_admin_or_gl(p_user_id uuid, p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  -- Hole die Rolle des Users in der Firma
  SELECT role INTO user_role
  FROM company_members
  WHERE user_id = p_user_id
  AND company_id = p_company_id;

  -- Wenn keine Rolle gefunden (NULL), return false
  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Prüfe ob Admin oder GL
  RETURN user_role IN ('admin', 'gl');
END;
$$;

-- Verbesserte Assignee Check Function
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

-- Kommentar für Debugging:
-- Falls das immer noch nicht funktioniert, führe diese Query aus um zu sehen was los ist:
--
-- SELECT
--   t.id,
--   t.title,
--   t.created_by,
--   t.company_id,
--   auth.uid() as current_user,
--   (t.created_by = auth.uid()) as is_creator,
--   user_is_admin_or_gl(auth.uid(), t.company_id) as is_admin_or_gl,
--   user_is_todo_assignee(auth.uid(), t.id) as is_assignee,
--   EXISTS (
--     SELECT 1 FROM company_members
--     WHERE user_id = auth.uid()
--     AND company_id = t.company_id
--   ) as is_company_member
-- FROM todos t
-- WHERE t.company_id = 'deine-company-id'::uuid;
