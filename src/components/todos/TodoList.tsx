'use client'

/**
 * TodoList Component
 * Zeigt alle ToDos in einer Liste an
 */

import { type TodoWithDetails } from '@/lib/db/todos'
import TodoItem from './TodoItem'

interface TodoListProps {
  todos: TodoWithDetails[]
  onTodoUpdated: () => void
  onTodoDeleted: () => void
  companySlug: string
}

export default function TodoList({ todos, onTodoUpdated, onTodoDeleted, companySlug }: TodoListProps) {
  return (
    <div className="space-y-4">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onTodoUpdated={onTodoUpdated}
          onTodoDeleted={onTodoDeleted}
          companySlug={companySlug}
        />
      ))}
    </div>
  )
}
