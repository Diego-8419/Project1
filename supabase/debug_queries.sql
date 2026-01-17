-- Debug Queries - Führe diese nacheinander in Supabase SQL Editor aus
-- um zu verstehen, warum ToDos nicht angezeigt werden

-- 1. Zeige ALLE ToDos (ohne RLS)
SELECT
  id,
  title,
  created_by,
  company_id,
  created_at
FROM todos
ORDER BY created_at DESC
LIMIT 10;

-- 2. Zeige deine User ID und Company Membership
SELECT
  auth.uid() as my_user_id,
  cm.company_id,
  cm.role,
  c.name as company_name
FROM company_members cm
JOIN companies c ON c.id = cm.company_id
WHERE cm.user_id = auth.uid();

-- 3. Zeige alle ToDo Assignments
SELECT
  ta.todo_id,
  ta.user_id,
  t.title,
  t.created_by
FROM todo_assignees ta
JOIN todos t ON t.id = ta.todo_id
ORDER BY ta.assigned_at DESC
LIMIT 10;

-- 4. Teste die Helper Functions für ein spezifisches ToDo
-- ERSETZE 'todo-id-hier' mit einer echten ToDo ID aus Query 1
SELECT
  t.id,
  t.title,
  t.created_by,
  auth.uid() as current_user,
  (t.created_by = auth.uid()) as is_creator,
  user_is_admin_or_gl(auth.uid(), t.company_id) as is_admin_or_gl,
  user_is_todo_assignee(auth.uid(), t.id) as is_assignee,
  EXISTS (
    SELECT 1 FROM company_members
    WHERE user_id = auth.uid()
    AND company_id = t.company_id
  ) as is_company_member
FROM todos t
LIMIT 1;

-- 5. Teste die RLS Policy direkt - Diese Query sollte nur ToDos zeigen, die du sehen darfst
SELECT
  id,
  title,
  created_by,
  company_id
FROM todos
WHERE EXISTS (
  SELECT 1 FROM company_members
  WHERE user_id = auth.uid()
  AND company_id = todos.company_id
)
AND (
  created_by = auth.uid()
  OR user_is_admin_or_gl(auth.uid(), todos.company_id)
  OR user_is_todo_assignee(auth.uid(), todos.id)
);
