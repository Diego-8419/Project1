/**
 * Supabase Database Types
 * TypeScript-Typen für die Datenbank
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      company_members: {
        Row: {
          id: string
          company_id: string
          user_id: string
          role: 'admin' | 'gl' | 'superuser' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          role: 'admin' | 'gl' | 'superuser' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          role?: 'admin' | 'gl' | 'superuser' | 'user'
          created_at?: string
          updated_at?: string
        }
      }
      superuser_permissions: {
        Row: {
          id: string
          superuser_id: string
          company_id: string | null
          target_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          superuser_id: string
          company_id?: string | null
          target_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          superuser_id?: string
          company_id?: string | null
          target_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      todos: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string | null
          status: 'open' | 'in_progress' | 'question' | 'done'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          priority_order: number
          deadline: string | null
          created_by: string
          in_progress_note: string | null
          question_note: string | null
          done_note: string | null
          archived: boolean
          archived_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description?: string | null
          status?: 'open' | 'in_progress' | 'question' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          priority_order?: number
          deadline?: string | null
          created_by: string
          in_progress_note?: string | null
          question_note?: string | null
          done_note?: string | null
          archived?: boolean
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          description?: string | null
          status?: 'open' | 'in_progress' | 'question' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          priority_order?: number
          deadline?: string | null
          created_by?: string
          in_progress_note?: string | null
          question_note?: string | null
          done_note?: string | null
          archived?: boolean
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      todo_assignees: {
        Row: {
          id: string
          todo_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          todo_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          todo_id?: string
          user_id?: string
          created_at?: string
        }
      }
      todo_permissions: {
        Row: {
          id: string
          todo_id: string
          user_id: string | null
          role: 'admin' | 'gl' | 'user' | null
          level: 'view' | 'edit' | 'admin'
          created_at: string
        }
        Insert: {
          id?: string
          todo_id: string
          user_id?: string | null
          role?: 'admin' | 'gl' | 'user' | null
          level: 'view' | 'edit' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          todo_id?: string
          user_id?: string | null
          role?: 'admin' | 'gl' | 'user' | null
          level?: 'view' | 'edit' | 'admin'
          created_at?: string
        }
      }
      subtasks: {
        Row: {
          id: string
          todo_id: string
          title: string
          description: string | null
          status: 'open' | 'in_progress' | 'question' | 'done'
          order_index: number
          created_by: string
          in_progress_note: string | null
          question_note: string | null
          done_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          todo_id: string
          title: string
          description?: string | null
          status?: 'open' | 'in_progress' | 'question' | 'done'
          order_index?: number
          created_by: string
          in_progress_note?: string | null
          question_note?: string | null
          done_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          todo_id?: string
          title?: string
          description?: string | null
          status?: 'open' | 'in_progress' | 'question' | 'done'
          order_index?: number
          created_by?: string
          in_progress_note?: string | null
          question_note?: string | null
          done_note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subtask_assignees: {
        Row: {
          id: string
          subtask_id: string
          user_id: string
          assigned_at: string
        }
        Insert: {
          id?: string
          subtask_id: string
          user_id: string
          assigned_at?: string
        }
        Update: {
          id?: string
          subtask_id?: string
          user_id?: string
          assigned_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          todo_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          todo_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          todo_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          company_id: string
          name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          uploaded_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      todo_documents: {
        Row: {
          id: string
          todo_id: string
          document_id: string
          created_at: string
        }
        Insert: {
          id?: string
          todo_id: string
          document_id: string
          created_at?: string
        }
        Update: {
          id?: string
          todo_id?: string
          document_id?: string
          created_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          comment_id: string
          file_path: string
          file_name: string
          file_size: number
          mime_type: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          file_path: string
          file_name: string
          file_size: number
          mime_type: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          file_path?: string
          file_name?: string
          file_size?: number
          mime_type?: string
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          company_id: string
          user_id: string
          action: 'create' | 'update' | 'delete' | 'assign' | 'comment' | 'status_change'
          entity_type: string
          entity_id: string
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          action: 'create' | 'update' | 'delete' | 'assign' | 'comment' | 'status_change'
          entity_type: string
          entity_id: string
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          action?: 'create' | 'update' | 'delete' | 'assign' | 'comment' | 'status_change'
          entity_type?: string
          entity_id?: string
          details?: Json
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'assigned' | 'comment' | 'status_change' | 'due_soon' | 'overdue' | 'mention'
          title: string
          message: string
          read: boolean
          entity_type: string | null
          entity_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'assigned' | 'comment' | 'status_change' | 'due_soon' | 'overdue' | 'mention'
          title: string
          message: string
          read?: boolean
          entity_type?: string | null
          entity_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'assigned' | 'comment' | 'status_change' | 'due_soon' | 'overdue' | 'mention'
          title?: string
          message?: string
          read?: boolean
          entity_type?: string | null
          entity_id?: string | null
          created_at?: string
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'gl' | 'user'
      todo_status: 'open' | 'in_progress' | 'review' | 'completed'
      todo_priority: 'low' | 'medium' | 'high' | 'urgent'
      permission_level: 'view' | 'edit' | 'admin'
      activity_action: 'create' | 'update' | 'delete' | 'assign' | 'comment' | 'status_change'
      notification_type: 'assigned' | 'comment' | 'status_change' | 'due_soon' | 'overdue' | 'mention'
    }
  }
}
