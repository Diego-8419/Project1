/**
 * Permission Utilities
 * App-Level Security nachdem RLS deaktiviert wurde
 */

import { type CompanyWithRole } from '@/lib/db/companies'
import { type TodoWithDetails } from '@/lib/db/todos'

/**
 * Prüft ob der User Admin ist
 */
export function isAdmin(currentCompany: CompanyWithRole | null): boolean {
  if (!currentCompany) return false
  return currentCompany.role === 'admin'
}

/**
 * Prüft ob der User Admin oder GL (Geschäftsleitung) ist
 */
export function isAdminOrGL(currentCompany: CompanyWithRole | null): boolean {
  if (!currentCompany) return false
  return currentCompany.role === 'admin' || currentCompany.role === 'gl'
}

/**
 * Prüft ob der User Admin, GL oder Superuser ist
 */
export function isAdminGLOrSuperuser(currentCompany: CompanyWithRole | null): boolean {
  if (!currentCompany) return false
  return currentCompany.role === 'admin' || currentCompany.role === 'gl' || currentCompany.role === 'superuser'
}

/**
 * Prüft ob der User das Todo sehen darf
 * - Admin/GL/Superuser sehen alles in ihrer Company
 * - User sehen nur ihre eigenen oder zugewiesene ToDos
 */
export function canViewTodo(
  todo: TodoWithDetails,
  userId: string,
  currentCompany: CompanyWithRole | null
): boolean {
  if (!currentCompany) return false

  // Admin, GL und Superuser sehen alles in ihrer Company
  if (isAdminGLOrSuperuser(currentCompany)) {
    return todo.company_id === currentCompany.id
  }

  // User sehen nur ihre eigenen oder zugewiesene ToDos
  const isCreator = todo.created_by === userId
  const isAssignee = todo.assignees.some(a => a.user_id === userId)

  return (isCreator || isAssignee) && todo.company_id === currentCompany.id
}

/**
 * Prüft ob der User das Todo bearbeiten darf
 * - Admin/GL/Superuser können alles bearbeiten
 * - Creator können ihr eigenes Todo bearbeiten
 */
export function canEditTodo(
  todo: TodoWithDetails,
  userId: string,
  currentCompany: CompanyWithRole | null
): boolean {
  if (!currentCompany) return false

  // Admin, GL und Superuser können alles bearbeiten
  if (isAdminGLOrSuperuser(currentCompany)) {
    return todo.company_id === currentCompany.id
  }

  // Creator können ihr eigenes Todo bearbeiten
  const isCreator = todo.created_by === userId

  return isCreator && todo.company_id === currentCompany.id
}

/**
 * Prüft ob der User den Status ändern darf
 * - Admin/GL/Superuser können alles ändern
 * - Creator können den Status ändern
 * - Assignees können den Status ändern
 */
export function canChangeStatus(
  todo: TodoWithDetails,
  userId: string,
  currentCompany: CompanyWithRole | null
): boolean {
  if (!currentCompany) return false

  // Admin, GL und Superuser können alles ändern
  if (isAdminGLOrSuperuser(currentCompany)) {
    return todo.company_id === currentCompany.id
  }

  // Creator und Assignees können Status ändern
  const isCreator = todo.created_by === userId
  const isAssignee = todo.assignees.some(a => a.user_id === userId)

  return (isCreator || isAssignee) && todo.company_id === currentCompany.id
}

/**
 * Prüft ob der User das Todo löschen darf
 * - Admin/GL/Superuser oder Creator
 */
export function canDeleteTodo(
  todo: TodoWithDetails,
  userId: string,
  currentCompany: CompanyWithRole | null
): boolean {
  if (!currentCompany) return false

  // Admin, GL und Superuser können alles löschen
  if (isAdminGLOrSuperuser(currentCompany)) {
    return todo.company_id === currentCompany.id
  }

  // Creator können ihr eigenes Todo löschen
  return todo.created_by === userId && todo.company_id === currentCompany.id
}

/**
 * Prüft ob der User Firmen löschen darf
 * - Nur Admins können Firmen löschen
 */
export function canDeleteCompany(currentCompany: CompanyWithRole | null): boolean {
  if (!currentCompany) return false
  return currentCompany.role === 'admin'
}

/**
 * Filtert eine Liste von ToDos basierend auf den Berechtigungen
 */
export function filterTodosByPermissions(
  todos: TodoWithDetails[],
  userId: string,
  currentCompany: CompanyWithRole | null
): TodoWithDetails[] {
  if (!currentCompany) return []

  return todos.filter(todo => canViewTodo(todo, userId, currentCompany))
}
