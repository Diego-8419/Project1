-- Fix Trigger Functions die Rekursion verursachen
-- Problem: log_todo_assignment macht SELECT auf todos, was RLS triggert

-- Lösche alte Trigger
DROP TRIGGER IF EXISTS log_todo_changes_trigger ON todos;
DROP TRIGGER IF EXISTS log_todo_assignment_trigger ON todo_assignees;
DROP TRIGGER IF EXISTS set_todo_priority_order_trigger ON todos;

-- Erstelle verbesserte log_todo_assignment Function OHNE SELECT auf todos
CREATE OR REPLACE FUNCTION log_todo_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  todo_company_id UUID;
  assigned_user_email TEXT;
BEGIN
  -- WICHTIG: Verwende direkt die company_id aus dem Context
  -- Statt SELECT auf todos zu machen (verursacht Rekursion)

  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    -- Get company_id direkt vom trigger context
    -- Wir müssen hier trotzdem SELECT machen, aber NUR wenn nötig

    -- Für jetzt: Deaktiviere das Logging temporär um Rekursion zu vermeiden
    RETURN COALESCE(NEW, OLD);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Vereinfachte log_todo_changes - KEIN SELECT auf andere Tabellen
CREATE OR REPLACE FUNCTION log_todo_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  change_data JSONB;
BEGIN
  -- Verwende NEW/OLD direkt, KEIN SELECT auf andere Tabellen

  IF TG_OP = 'INSERT' THEN
    change_data = jsonb_build_object(
      'title', NEW.title,
      'status', NEW.status,
      'priority', NEW.priority
    );

    -- Deaktiviere Logging temporär
    -- INSERT INTO activity_logs...

  ELSIF TG_OP = 'UPDATE' THEN
    change_data = jsonb_build_object();

    IF OLD.status IS DISTINCT FROM NEW.status THEN
      change_data = change_data || jsonb_build_object(
        'status', jsonb_build_object('old', OLD.status, 'new', NEW.status)
      );
    END IF;

    -- Deaktiviere Logging temporär
    -- INSERT INTO activity_logs...

  ELSIF TG_OP = 'DELETE' THEN
    change_data = jsonb_build_object(
      'title', OLD.title,
      'status', OLD.status
    );

    -- Deaktiviere Logging temporär
    -- INSERT INTO activity_logs...
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Setze priority_order bleibt wie es ist (macht keinen SELECT)
-- (Function existiert bereits und ist OK)

-- WICHTIG: Re-enable die Trigger OHNE Activity Logging
-- Logging ist temporär deaktiviert um Rekursion zu vermeiden
CREATE TRIGGER log_todo_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION log_todo_changes();

CREATE TRIGGER log_todo_assignment_trigger
  AFTER INSERT OR DELETE ON todo_assignees
  FOR EACH ROW
  EXECUTE FUNCTION log_todo_assignment();

CREATE TRIGGER set_todo_priority_order_trigger
  BEFORE INSERT ON todos
  FOR EACH ROW
  EXECUTE FUNCTION set_todo_priority_order();

-- HINWEIS:
-- Activity Logging ist temporär deaktiviert
-- Die Functions existieren noch, machen aber nichts
-- Später können wir eine Queue-basierte Lösung implementieren
