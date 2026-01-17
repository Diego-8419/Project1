-- Fix UPDATE Policy mit Assignee-Support
-- Lösung: SECURITY DEFINER Function die Rekursion vermeidet

-- Lösche die alte UPDATE Policy
DROP POLICY IF EXISTS "Users can update todos based on role" ON todos;

-- Erstelle eine SECURITY DEFINER Function die prüft ob User das ToDo updaten darf
-- Diese Function bypassed RLS und vermeidet damit Rekursion
CREATE OR REPLACE FUNCTION user_can_update_todo(p_user_id uuid, p_todo_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  todo_company_id uuid;
  todo_created_by uuid;
  user_role text;
  is_assignee boolean;
BEGIN
  -- Hole ToDo Details
  SELECT company_id, created_by INTO todo_company_id, todo_created_by
  FROM todos
  WHERE id = p_todo_id;

  -- Wenn ToDo nicht existiert
  IF todo_company_id IS NULL THEN
    RETURN false;
  END IF;

  -- Hole User Rolle in der Firma
  SELECT role INTO user_role
  FROM company_members
  WHERE user_id = p_user_id
  AND company_id = todo_company_id;

  -- User muss Mitglied der Firma sein
  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Admin/GL können alles updaten
  IF user_role IN ('admin', 'gl') THEN
    RETURN true;
  END IF;

  -- Creator kann eigene ToDos updaten
  IF todo_created_by = p_user_id THEN
    RETURN true;
  END IF;

  -- Prüfe ob User ein Assignee ist (ohne RLS, daher keine Rekursion)
  SELECT EXISTS (
    SELECT 1 FROM todo_assignees
    WHERE todo_id = p_todo_id
    AND user_id = p_user_id
  ) INTO is_assignee;

  RETURN is_assignee;
END;
$$;

-- Neue UPDATE Policy die die SECURITY DEFINER Function nutzt
CREATE POLICY "Users can update todos based on role"
  ON todos FOR UPDATE
  TO authenticated
  USING (
    user_can_update_todo(auth.uid(), todos.id)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE user_id = auth.uid()
      AND company_id = todos.company_id
    )
  );
