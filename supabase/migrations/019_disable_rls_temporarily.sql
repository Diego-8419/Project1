-- TEMPORÄR: Deaktiviere RLS komplett um zu testen ob das das Problem ist
-- Dies ist NUR zum Testen - NICHT für Production!

-- Deaktiviere RLS auf allen ToDo-Tabellen
ALTER TABLE todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE todo_assignees DISABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE subtask_assignees DISABLE ROW LEVEL SECURITY;

-- WICHTIG: Dies deaktiviert ALLE Security!
-- Jeder kann alles sehen und ändern
-- NUR ZUM TESTEN!
