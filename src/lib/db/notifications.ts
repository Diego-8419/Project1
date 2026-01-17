/**
 * Notifications Database Queries
 * Funktionen für Benachrichtigungen
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export type Notification = {
  id: string
  user_id: string
  todo_id: string | null
  type: 'todo_assigned' | 'todo_status_changed' | 'todo_comment' | 'todo_completed' | 'todo_deadline_approaching'
  title: string
  message: string
  read: boolean
  read_at: string | null
  created_at: string
}

/**
 * Holt alle Benachrichtigungen für einen User
 */
export async function getUserNotifications(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number = 50
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error loading notifications:', error)
    throw error
  }

  return (data || []) as Notification[]
}

/**
 * Holt Anzahl ungelesener Benachrichtigungen
 */
export async function getUnreadCount(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) {
    console.error('Error counting unread notifications:', error)
    return 0
  }

  return count || 0
}

/**
 * Markiert eine Benachrichtigung als gelesen
 */
export async function markAsRead(
  supabase: SupabaseClient<Database>,
  notificationId: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

/**
 * Markiert alle Benachrichtigungen als gelesen
 */
export async function markAllAsRead(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    throw error
  }
}

/**
 * Erstellt eine Benachrichtigung für Status-Änderung
 */
export async function createStatusChangeNotification(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string
    todoId: string
    todoTitle: string
    oldStatus: string
    newStatus: string
    changedBy: string
  }
): Promise<void> {
  const statusLabels: Record<string, string> = {
    open: 'Offen',
    in_progress: 'In Bearbeitung',
    question: 'Rückfrage',
    done: 'Erledigt',
  }

  const { error } = await (supabase as any)
    .from('notifications')
    .insert({
      user_id: params.userId,
      todo_id: params.todoId,
      type: 'todo_status_changed',
      title: 'Status geändert',
      message: `"${params.todoTitle}" wurde von ${statusLabels[params.oldStatus]} zu ${statusLabels[params.newStatus]} geändert`,
    })

  if (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

/**
 * Erstellt Benachrichtigungen für Zuweisung
 */
export async function createAssignmentNotification(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string
    todoId: string
    todoTitle: string
    assignedBy: string
  }
): Promise<void> {
  const { error } = await (supabase as any)
    .from('notifications')
    .insert({
      user_id: params.userId,
      todo_id: params.todoId,
      type: 'todo_assigned',
      title: 'Neues ToDo zugewiesen',
      message: `Sie wurden "${params.todoTitle}" zugewiesen`,
    })

  if (error) {
    console.error('Error creating assignment notification:', error)
    throw error
  }
}

/**
 * Löscht eine Benachrichtigung
 */
export async function deleteNotification(
  supabase: SupabaseClient<Database>,
  notificationId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) {
    console.error('Error deleting notification:', error)
    throw error
  }
}

/**
 * Löscht alle Benachrichtigungen eines Users
 */
export async function deleteAllNotifications(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting all notifications:', error)
    throw error
  }
}
