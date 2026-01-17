-- Migration 023: Superuser-Rolle, Status-Notes und Archiv
-- Datum: 2026-01-14

-- 1. Erweitere company_members Rolle um 'superuser'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superuser';

-- 2. Erstelle Tabelle für Superuser-Berechtigungen (welche Firmen/User ein Superuser sehen kann)
CREATE TABLE IF NOT EXISTS superuser_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  superuser_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ein Superuser kann entweder eine Firma ODER einen User sehen
  CONSTRAINT superuser_permissions_check CHECK (
    (company_id IS NOT NULL AND target_user_id IS NULL) OR
    (company_id IS NULL AND target_user_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_superuser_permissions_superuser_id ON superuser_permissions(superuser_id);
CREATE INDEX IF NOT EXISTS idx_superuser_permissions_company_id ON superuser_permissions(company_id);
CREATE INDEX IF NOT EXISTS idx_superuser_permissions_target_user_id ON superuser_permissions(target_user_id);

-- 3. Erweitere todos Tabelle um Status-Notes und Archiv
ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS in_progress_note TEXT,
  ADD COLUMN IF NOT EXISTS question_note TEXT,
  ADD COLUMN IF NOT EXISTS done_note TEXT,
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 4. Erweitere subtasks Tabelle um Status-Notes
ALTER TABLE subtasks
  ADD COLUMN IF NOT EXISTS in_progress_note TEXT,
  ADD COLUMN IF NOT EXISTS question_note TEXT,
  ADD COLUMN IF NOT EXISTS done_note TEXT;

-- 5. Erweitere activity_logs um note_changes
ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS note_type TEXT,
  ADD COLUMN IF NOT EXISTS note_content TEXT;

-- 6. Index für archivierte Todos
CREATE INDEX IF NOT EXISTS idx_todos_archived ON todos(archived, company_id);

-- 7. Trigger für updated_at auf superuser_permissions
CREATE OR REPLACE FUNCTION update_superuser_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_superuser_permissions_updated_at
  BEFORE UPDATE ON superuser_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_superuser_permissions_updated_at();

-- 8. Funktion zum Archivieren von Todos
CREATE OR REPLACE FUNCTION archive_todo(todo_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE todos
  SET archived = TRUE, archived_at = NOW()
  WHERE id = todo_id_param;
END;
$$ LANGUAGE plpgsql;

-- 9. Funktion zum Wiederherstellen von Todos
CREATE OR REPLACE FUNCTION unarchive_todo(todo_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE todos
  SET archived = FALSE, archived_at = NULL
  WHERE id = todo_id_param;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE superuser_permissions IS 'Definiert welche Firmen und User ein Superuser sehen kann';
COMMENT ON COLUMN todos.in_progress_note IS 'Notiz wenn Status auf "in_progress" geändert wird';
COMMENT ON COLUMN todos.question_note IS 'Notiz wenn Status auf "question" geändert wird';
COMMENT ON COLUMN todos.done_note IS 'Notiz wenn Status auf "done" geändert wird';
COMMENT ON COLUMN todos.archived IS 'Ob das ToDo archiviert wurde';
