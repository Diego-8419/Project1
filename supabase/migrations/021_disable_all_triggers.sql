-- Deaktiviere ALLE Triggers auf todos komplett
-- Das ist der letzte Test um die Rekursion zu beheben

DROP TRIGGER IF EXISTS log_todo_changes_trigger ON todos;
DROP TRIGGER IF EXISTS log_todo_assignment_trigger ON todo_assignees;
DROP TRIGGER IF EXISTS set_todo_priority_order_trigger ON todos;

-- Lösche auch die priority_order Function die SELECT auf todos macht
DROP FUNCTION IF EXISTS set_todo_priority_order() CASCADE;
DROP FUNCTION IF EXISTS log_todo_changes() CASCADE;
DROP FUNCTION IF EXISTS log_todo_assignment() CASCADE;

-- ALLE Triggers sind jetzt deaktiviert
-- KEIN Code wird mehr bei UPDATE/INSERT/DELETE ausgeführt
-- Wenn es jetzt IMMER NOCH Rekursion gibt, dann ist es die RLS Policy selbst
