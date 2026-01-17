/**
 * ToDo Database Queries
 * CRUD-Operationen für ToDos, Zuweisungen und Subtasks
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { createStatusChangeNotification } from './notifications'

type Todo = Database['public']['Tables']['todos']['Row']
type TodoInsert = Database['public']['Tables']['todos']['Insert']
type TodoUpdate = Database['public']['Tables']['todos']['Update']
type Subtask = Database['public']['Tables']['subtasks']['Row']
type SubtaskInsert = Database['public']['Tables']['subtasks']['Insert']

export interface TodoWithDetails extends Todo {
  assignees: Array<{
    user_id: string
    user_email: string
    full_name: string | null
  }>
  subtasks: Array<Subtask & {
    assignees: Array<{
      user_id: string
      user_email: string
      full_name: string | null
    }>
  }>
  created_by_user: {
    email: string
    full_name: string | null
  }
}

/**
 * Hole alle ToDos einer Firma
 */
export async function getCompanyTodos(
  supabase: SupabaseClient<Database>,
  companyId: string
): Promise<TodoWithDetails[]> {
  // Hole alle ToDos mit Creator-Profil
  const { data: todos, error: todosError } = await supabase
    .from('todos')
    .select(`
      *,
      created_by_profile:user_profiles!todos_created_by_fkey(full_name)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (todosError) throw todosError
  if (!todos) return []

  // Hole Firmen-Mitglieder für E-Mail-Adressen
  const { data: companyMembers } = await (supabase as any)
    .from('company_members')
    .select('user_id')
    .eq('company_id', companyId)

  const memberIds = companyMembers?.map((m: any) => m.user_id) || []

  // Hole alle User-Profile
  const { data: profiles } = await (supabase as any)
    .from('user_profiles')
    .select('id, email, full_name')
    .in('id', memberIds)

  const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])

  // Für E-Mails müssen wir die auth.users Tabelle nutzen (nur server-side möglich)
  // Erstmal verwenden wir nur die Profile

  // Hole für jedes ToDo die Details
  const todosWithDetails = await Promise.all(
    todos.map(async (todo: any) => {
      // Hole Assignees
      const { data: assigneeData } = await (supabase as any)
        .from('todo_assignees')
        .select('user_id')
        .eq('todo_id', todo.id)

      const assigneesWithDetails = (assigneeData || []).map((a: any) => {
        const profile: any = profileMap.get(a.user_id)
        return {
          user_id: a.user_id,
          user_email: profile?.email || a.user_id,
          full_name: profile?.full_name || null,
        }
      })

      // Hole Subtasks
      const { data: subtasks } = await supabase
        .from('subtasks')
        .select('*')
        .eq('todo_id', todo.id)
        .order('order_index', { ascending: true })

      const subtasksWithAssignees = await Promise.all(
        (subtasks || []).map(async (subtask: any) => {
          const { data: subtaskAssigneeData } = await (supabase as any)
            .from('subtask_assignees')
            .select('user_id')
            .eq('subtask_id', subtask.id)

          const subtaskAssignees = (subtaskAssigneeData || []).map((sa: any) => {
            const profile: any = profileMap.get(sa.user_id)
            return {
              user_id: sa.user_id,
              user_email: profile?.email || sa.user_id,
              full_name: profile?.full_name || null,
            }
          })

          return {
            ...subtask,
            assignees: subtaskAssignees,
          }
        })
      )

      const creatorProfile: any = profileMap.get(todo.created_by)

      return {
        ...todo,
        assignees: assigneesWithDetails,
        subtasks: subtasksWithAssignees,
        created_by_user: {
          email: creatorProfile?.email || todo.created_by,
          full_name: creatorProfile?.full_name || null,
        },
      }
    })
  )

  return todosWithDetails
}

/**
 * Hole ein einzelnes ToDo mit allen Details
 */
export async function getTodoById(
  supabase: SupabaseClient<Database>,
  todoId: string
): Promise<TodoWithDetails | null> {
  const { data: todo, error } = await supabase
    .from('todos')
    .select('*')
    .eq('id', todoId)
    .single()

  if (error) throw error
  if (!todo) return null

  // Hole Assignees
  const { data: assigneeData } = await (supabase as any)
    .from('todo_assignees')
    .select('user_id')
    .eq('todo_id', (todo as any).id)

  const assignees = assigneeData || []

  const assigneesWithDetails = await Promise.all(
    assignees.map(async (a: any) => {
      const { data: { user } } = await supabase.auth.admin.getUserById(a.user_id)
      const { data: profile } = await (supabase as any)
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', a.user_id)
        .single()

      return {
        user_id: a.user_id,
        user_email: (profile as any)?.email || user?.email || '',
        full_name: (profile as any)?.full_name || null,
      }
    })
  )

  // Hole Subtasks
  const { data: subtasks } = await supabase
    .from('subtasks')
    .select('*')
    .eq('todo_id', (todo as any).id)
    .order('created_at', { ascending: true })

  const subtasksWithAssignees = await Promise.all(
    (subtasks || []).map(async (subtask: any) => {
      const { data: subtaskAssigneeData } = await (supabase as any)
        .from('subtask_assignees')
        .select('user_id')
        .eq('subtask_id', subtask.id)

      const subtaskAssignees = await Promise.all(
        (subtaskAssigneeData || []).map(async (sa: any) => {
          const { data: { user } } = await supabase.auth.admin.getUserById(sa.user_id)
          const { data: profile } = await (supabase as any)
            .from('user_profiles')
            .select('full_name, email')
            .eq('id', sa.user_id)
            .single()

          return {
            user_id: sa.user_id,
            user_email: (profile as any)?.email || user?.email || '',
            full_name: (profile as any)?.full_name || null,
          }
        })
      )

      return {
        ...subtask,
        assignees: subtaskAssignees,
      }
    })
  )

  // Hole Creator-Details
  const { data: { user: creator } } = await supabase.auth.admin.getUserById((todo as any).created_by)
  const { data: creatorProfile } = await (supabase as any)
    .from('user_profiles')
    .select('full_name, email')
    .eq('id', (todo as any).created_by)
    .single()

  return {
    ...(todo as any),
    assignees: assigneesWithDetails,
    subtasks: subtasksWithAssignees,
    created_by_user: {
      email: creator?.email || '',
      full_name: (creatorProfile as any)?.full_name || null,
    },
  }
}

/**
 * Erstelle ein neues ToDo
 */
export async function createTodo(
  supabase: SupabaseClient<Database>,
  data: {
    companyId: string
    userId: string
    title: string
    description?: string
    status?: 'open' | 'in_progress' | 'question' | 'done'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    deadline?: string
    assigneeIds?: string[]
  }
): Promise<Todo> {
  // Erstelle ToDo
  const { data: todo, error } = await (supabase as any)
    .from('todos')
    .insert({
      company_id: data.companyId,
      created_by: data.userId,
      title: data.title,
      description: data.description || null,
      status: data.status || 'open',
      priority: data.priority || 'medium',
      deadline: data.deadline || null,
    })
    .select()
    .single()

  if (error) throw error

  // Füge Assignees hinzu
  if (data.assigneeIds && data.assigneeIds.length > 0) {
    const { error: assignError } = await (supabase as any)
      .from('todo_assignees')
      .insert(
        data.assigneeIds.map((userId) => ({
          todo_id: todo.id,
          user_id: userId,
        }))
      )

    if (assignError) throw assignError
  }

  return todo
}

/**
 * Aktualisiere ein ToDo
 */
export async function updateTodo(
  supabase: SupabaseClient<Database>,
  todoId: string,
  updates: TodoUpdate
): Promise<Todo> {
  const { data: todo, error } = await (supabase as any)
    .from('todos')
    .update(updates as any)
    .eq('id', todoId)
    .select()
    .single()

  if (error) throw error
  return todo as Todo
}

/**
 * Aktualisiere ToDo Status mit Notiz
 */
export async function updateTodoStatus(
  supabase: SupabaseClient<Database>,
  todoId: string,
  status: 'open' | 'in_progress' | 'question' | 'done',
  note?: string,
  currentUserId?: string
): Promise<Todo> {
  // Hole vorher das alte ToDo für Benachrichtigungen
  const { data: oldTodo, error: fetchError } = await supabase
    .from('todos')
    .select('*, created_by, title, status')
    .eq('id', todoId)
    .single()

  if (fetchError) throw fetchError

  const updates: any = { status }

  // Füge die entsprechende Notiz hinzu basierend auf dem Status
  if (note) {
    if (status === 'in_progress') {
      updates.in_progress_note = note
    } else if (status === 'question') {
      updates.question_note = note
    } else if (status === 'done') {
      updates.done_note = note
    }
  }

  const { data: todo, error } = await (supabase as any)
    .from('todos')
    .update(updates)
    .eq('id', todoId)
    .select()
    .single()

  if (error) throw error

  // Benachrichtigungen erstellen (nur wenn Status sich geändert hat)
  if (oldTodo && (oldTodo as any).status !== status) {
    try {
      // Hole Assignees
      const { data: assignees } = await (supabase as any)
        .from('todo_assignees')
        .select('user_id')
        .eq('todo_id', todoId)

      const assigneeIds = assignees?.map((a: any) => a.user_id) || []

      // Liste der zu benachrichtigenden User (Creator + Assignees, aber nicht der aktuelle User)
      const usersToNotify = new Set<string>()
      if ((oldTodo as any).created_by && (!currentUserId || (oldTodo as any).created_by !== currentUserId)) {
        usersToNotify.add((oldTodo as any).created_by)
      }
      assigneeIds.forEach((id: string) => {
        if (!currentUserId || id !== currentUserId) {
          usersToNotify.add(id)
        }
      })

      // Benachrichtigungen erstellen
      for (const userId of usersToNotify) {
        await createStatusChangeNotification(supabase, {
          userId,
          todoId,
          todoTitle: (oldTodo as any).title,
          oldStatus: (oldTodo as any).status,
          newStatus: status,
          changedBy: currentUserId || 'Unbekannt',
        })
      }
    } catch (notifError) {
      console.error('Error creating notifications:', notifError)
      // Fehler bei Benachrichtigungen soll nicht den ganzen Request abbrechen
    }
  }

  return todo as Todo
}

/**
 * Lösche ein ToDo
 */
export async function deleteTodo(
  supabase: SupabaseClient<Database>,
  todoId: string
): Promise<void> {
  const { error } = await supabase.from('todos').delete().eq('id', todoId)
  if (error) throw error
}

/**
 * Füge Assignees zu einem ToDo hinzu
 */
export async function addTodoAssignees(
  supabase: SupabaseClient<Database>,
  todoId: string,
  userIds: string[]
): Promise<void> {
  const { error } = await (supabase as any)
    .from('todo_assignees')
    .insert(
      userIds.map((userId) => ({
        todo_id: todoId,
        user_id: userId,
      }))
    )

  if (error) throw error
}

/**
 * Entferne Assignees von einem ToDo
 */
export async function removeTodoAssignees(
  supabase: SupabaseClient<Database>,
  todoId: string,
  userIds: string[]
): Promise<void> {
  const { error } = await (supabase as any)
    .from('todo_assignees')
    .delete()
    .eq('todo_id', todoId)
    .in('user_id', userIds)

  if (error) throw error
}

/**
 * Erstelle einen Subtask
 */
export async function createSubtask(
  supabase: SupabaseClient<Database>,
  data: {
    todoId: string
    userId: string
    title: string
    description?: string
    assigneeIds?: string[]
  }
): Promise<Subtask> {
  const { data: subtask, error } = await (supabase as any)
    .from('subtasks')
    .insert({
      todo_id: data.todoId,
      title: data.title,
      description: data.description || null,
      status: 'open',
      created_by: data.userId,
    })
    .select()
    .single()

  if (error) throw error

  // Füge Assignees hinzu
  if (data.assigneeIds && data.assigneeIds.length > 0) {
    const { error: assignError } = await (supabase as any)
      .from('subtask_assignees')
      .insert(
        data.assigneeIds.map((userId) => ({
          subtask_id: subtask.id,
          user_id: userId,
        }))
      )

    if (assignError) throw assignError
  }

  return subtask
}

/**
 * Aktualisiere einen Subtask
 */
export async function updateSubtask(
  supabase: SupabaseClient<Database>,
  subtaskId: string,
  updates: {
    title?: string
    description?: string | null
    status?: 'open' | 'in_progress' | 'question' | 'done'
  }
): Promise<Subtask> {
  const { data: subtask, error } = await (supabase as any)
    .from('subtasks')
    .update({
      title: updates.title,
      description: updates.description,
      status: updates.status,
    })
    .eq('id', subtaskId)
    .select()
    .single()

  if (error) throw error
  return subtask
}

/**
 * Lösche einen Subtask
 */
export async function deleteSubtask(
  supabase: SupabaseClient<Database>,
  subtaskId: string
): Promise<void> {
  const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId)
  if (error) throw error
}

/**
 * Archiviere ein ToDo
 */
export async function archiveTodo(
  supabase: SupabaseClient<Database>,
  todoId: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from('todos')
    .update({ archived: true, archived_at: new Date().toISOString() })
    .eq('id', todoId)

  if (error) throw error
}

/**
 * Entarchiviere ein ToDo
 */
export async function unarchiveTodo(
  supabase: SupabaseClient<Database>,
  todoId: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from('todos')
    .update({ archived: false, archived_at: null })
    .eq('id', todoId)

  if (error) throw error
}

/**
 * Hole Aktivitäts-Timeline für ein ToDo
 * Generiert Timeline-Einträge aus ToDo-Daten und Status-Notizen
 */
export async function getTodoActivities(
  supabase: SupabaseClient<Database>,
  todoId: string
): Promise<Array<{
  id: string
  timestamp: string
  type: 'status_change' | 'created'
  user: {
    name: string
    email: string
  }
  oldValue?: string
  newValue?: string
  note?: string
}>> {
  const todo = await getTodoById(supabase, todoId)
  if (!todo) return []

  const activities: Array<any> = []

  // Erstellt-Aktivität
  activities.push({
    id: `created-${todo.id}`,
    timestamp: todo.created_at,
    type: 'created',
    user: {
      name: todo.created_by_user.full_name || 'Unbekannt',
      email: todo.created_by_user.email,
    },
  })

  // Status-Änderungs-Aktivitäten basierend auf Notizen
  // Wir können nicht die vollständige Historie rekonstruieren ohne activity_logs Tabelle
  // Also zeigen wir nur die aktuellen Status-Notizen an

  if (todo.in_progress_note) {
    activities.push({
      id: `status-in_progress-${todo.id}`,
      timestamp: todo.updated_at, // Approximation
      type: 'status_change',
      user: {
        name: todo.created_by_user.full_name || 'Unbekannt',
        email: todo.created_by_user.email,
      },
      oldValue: 'open',
      newValue: 'in_progress',
      note: todo.in_progress_note,
    })
  }

  if (todo.question_note) {
    activities.push({
      id: `status-question-${todo.id}`,
      timestamp: todo.updated_at,
      type: 'status_change',
      user: {
        name: todo.created_by_user.full_name || 'Unbekannt',
        email: todo.created_by_user.email,
      },
      oldValue: todo.in_progress_note ? 'in_progress' : 'open',
      newValue: 'question',
      note: todo.question_note,
    })
  }

  if (todo.done_note) {
    activities.push({
      id: `status-done-${todo.id}`,
      timestamp: todo.updated_at,
      type: 'status_change',
      user: {
        name: todo.created_by_user.full_name || 'Unbekannt',
        email: todo.created_by_user.email,
      },
      oldValue: todo.question_note ? 'question' : todo.in_progress_note ? 'in_progress' : 'open',
      newValue: 'done',
      note: todo.done_note,
    })
  }

  // Sortiere chronologisch
  return activities.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}
