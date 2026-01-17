-- Prüfe ob es Triggers auf der todos Tabelle gibt die Rekursion verursachen könnten

-- Zeige alle Triggers auf todos
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table IN ('todos', 'todo_assignees', 'subtasks', 'subtask_assignees')
ORDER BY event_object_table, trigger_name;

-- Zeige alle Functions die von Triggers aufgerufen werden
SELECT
  n.nspname as schema,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%todo%'
ORDER BY p.proname;
