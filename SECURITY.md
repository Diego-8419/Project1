# Security Implementation

## Überblick

Diese Anwendung verwendet **App-Level Security** anstelle von Row Level Security (RLS) in der Datenbank.

### Warum kein RLS?

RLS wurde deaktiviert, da es zu unendlicher Rekursion führte. Dies geschah durch:
1. Trigger-Funktionen die SELECT-Abfragen auf die `todos`-Tabelle machten
2. Komplexe Policy-Bedingungen die Cross-Table-Checks erforderten
3. SECURITY DEFINER Funktionen die Policies triggerten

**Migration 022** hat RLS komplett deaktiviert: [supabase/migrations/022_disable_rls_completely.sql](supabase/migrations/022_disable_rls_completely.sql)

## App-Level Security Implementation

Die gesamte Sicherheitslogik ist in der Anwendungsschicht implementiert.

### Permission Utilities

Alle Berechtigungsfunktionen befinden sich in [src/lib/utils/permissions.ts](src/lib/utils/permissions.ts):

#### Funktionen:

1. **`isAdminOrGL(currentCompany)`**
   - Prüft ob User Admin oder GL (Geschäftsleitung) ist
   - Return: `boolean`

2. **`canViewTodo(todo, userId, currentCompany)`**
   - Admin/GL: Sehen alle ToDos ihrer Company
   - User: Sehen nur ihre eigenen oder zugewiesene ToDos
   - Return: `boolean`

3. **`canEditTodo(todo, userId, currentCompany)`**
   - Admin/GL: Können alles bearbeiten
   - Creator: Können ihr eigenes ToDo bearbeiten
   - Return: `boolean`

4. **`canChangeStatus(todo, userId, currentCompany)`**
   - Admin/GL: Können alles ändern
   - Creator: Können Status ändern
   - **Assignees: Können Status ändern** (wichtig!)
   - Return: `boolean`

5. **`canDeleteTodo(todo, userId, currentCompany)`**
   - Admin/GL: Können alles löschen
   - Creator: Können ihr eigenes ToDo löschen
   - Return: `boolean`

6. **`filterTodosByPermissions(todos, userId, currentCompany)`**
   - Filtert eine Liste von ToDos basierend auf Berechtigungen
   - Return: `TodoWithDetails[]`

### Verwendung in der Anwendung

#### ToDo-Liste laden ([src/app/(dashboard)/[companySlug]/todos/page.tsx](src/app/(dashboard)/[companySlug]/todos/page.tsx:33-42))

```typescript
const loadTodos = async () => {
  if (!currentCompany || !user) return

  try {
    setLoading(true)
    const allTodos = await getCompanyTodos(supabase, currentCompany.id)

    // App-Level Security: Filtere ToDos basierend auf Berechtigungen
    const filteredTodos = filterTodosByPermissions(allTodos, user.id, currentCompany)
    setTodos(filteredTodos)
  } catch (error) {
    console.error('Error loading todos:', error)
  } finally {
    setLoading(false)
  }
}
```

#### ToDo-Komponente ([src/components/todos/TodoItem.tsx](src/components/todos/TodoItem.tsx:30-33))

```typescript
// Berechtigungsprüfungen
const canChangeStatusPermission = user ? canChangeStatus(todo, user.id, currentCompany) : false
const canDeletePermission = user ? canDeleteTodo(todo, user.id, currentCompany) : false
const canEditPermission = user ? canEditTodo(todo, user.id, currentCompany) : false
```

UI-Elemente werden basierend auf Berechtigungen deaktiviert:

```typescript
<button
  onClick={() => canChangeStatusPermission && setShowStatusMenu(!showStatusMenu)}
  disabled={updating || !canChangeStatusPermission}
  title={!canChangeStatusPermission ? 'Keine Berechtigung zum Ändern des Status' : ''}
>
```

#### Handler-Funktionen ([src/components/todos/TodoItem.tsx](src/components/todos/TodoItem.tsx:63-83))

Alle kritischen Aktionen prüfen Berechtigungen:

```typescript
const handleStatusChange = async (newStatus: typeof todo.status) => {
  if (newStatus === todo.status) return

  // Berechtigungsprüfung
  if (!canChangeStatusPermission) {
    alert('Sie haben keine Berechtigung, den Status zu ändern.')
    return
  }

  // ... Rest der Funktion
}
```

## Rollen-System

### Rolle: Admin
- Sieht **alle** ToDos in allen Companies
- Kann **alles** bearbeiten, löschen, Status ändern
- Kann ToDos an **jeden** in der Company zuweisen

### Rolle: GL (Geschäftsleitung)
- Sieht **alle** ToDos in ihrer Company
- Kann **alles** bearbeiten, löschen, Status ändern
- Kann ToDos an **jeden** in der Company zuweisen

### Rolle: User
- Sieht nur:
  - Selbst erstellte ToDos
  - Zugewiesene ToDos
- Kann bearbeiten:
  - Nur selbst erstellte ToDos
- Kann Status ändern bei:
  - Selbst erstellten ToDos
  - Zugewiesenen ToDos (auch wenn nicht erstellt)
- Kann löschen:
  - Nur selbst erstellte ToDos

## Wichtige Sicherheitshinweise

### ⚠️ KRITISCH: Server-Side Validierung fehlt noch!

Aktuell werden Berechtigungen **nur auf Client-Seite** geprüft. Das bedeutet:

1. **Jeder kann die Datenbank direkt abfragen** (RLS ist deaktiviert)
2. **API-Endpoints haben keine Berechtigungsprüfung**
3. **Ein böswilliger User kann mit Supabase Client direkt Daten manipulieren**

### TODO: Server-Side Security implementieren

Für Production **MUSS** folgendes implementiert werden:

1. **API-Route Protection**
   - Erstelle Next.js API Routes für alle kritischen Operationen
   - Prüfe Berechtigungen auf dem Server
   - Beispiel: `/api/todos/[todoId]/route.ts`

2. **Supabase Service Role nur auf Server**
   - Client sollte nur lesende Zugriffe machen
   - Schreibende Operationen nur über API Routes

3. **Validation auf Server**
   - Validiere alle Inputs
   - Prüfe Company-Zugehörigkeit
   - Prüfe User-Berechtigungen

### Aktueller Entwicklungsstand

✅ **Implementiert:**
- App-Level Permission Checks
- UI-Berechtigungsprüfungen
- Client-Side Filterung

❌ **Noch nicht implementiert (KRITISCH für Production):**
- Server-Side API Routes mit Berechtigungsprüfung
- Input Validation auf Server
- Rate Limiting
- SQL Injection Prevention (durch Supabase TypeScript Client größtenteils gegeben)

## Migration History (RLS Attempts)

Die folgenden Migrationen dokumentieren die Versuche, RLS zu implementieren:

- **011-018**: Verschiedene RLS-Policy-Ansätze → Alle führten zu Rekursion
- **019**: Überlegung RLS temporär zu deaktivieren
- **020**: Fix für Trigger-Funktionen → Immer noch Rekursion
- **021**: Alle Triggers deaktiviert → Immer noch Rekursion
- **022**: ✅ RLS komplett deaktiviert → **Funktioniert**

## Best Practices

### Beim Entwickeln neuer Features:

1. **Immer Permissions prüfen** bevor UI-Elemente gerendert werden
2. **Handler-Funktionen** sollten Permissions prüfen bevor API-Calls
3. **Feedback geben** wenn User keine Berechtigung hat (Alert/Toast)
4. **Neue Berechtigungen** in `permissions.ts` hinzufügen

### Beispiel für neues Feature:

```typescript
// 1. Permission-Funktion in permissions.ts erstellen
export function canArchiveTodo(
  todo: TodoWithDetails,
  userId: string,
  currentCompany: CompanyWithRole | null
): boolean {
  if (!currentCompany) return false
  if (isAdminOrGL(currentCompany)) return true
  return todo.created_by === userId
}

// 2. In Komponente importieren und nutzen
import { canArchiveTodo } from '@/lib/utils/permissions'

const canArchive = user ? canArchiveTodo(todo, user.id, currentCompany) : false

// 3. UI basierend auf Permission rendern
{canArchive && (
  <button onClick={handleArchive}>Archivieren</button>
)}

// 4. Handler prüft Permission
const handleArchive = async () => {
  if (!canArchive) {
    alert('Keine Berechtigung')
    return
  }
  // ... Rest
}
```

## Testing

### Manuelle Tests durchführen:

1. **Als Admin anmelden**
   - Prüfen: Sieht alle ToDos
   - Prüfen: Kann alles bearbeiten/löschen
   - Prüfen: Kann Status von jedem ToDo ändern

2. **Als GL anmelden**
   - Prüfen: Sieht alle ToDos in Company
   - Prüfen: Kann alles bearbeiten/löschen
   - Prüfen: Kann Status von jedem ToDo ändern

3. **Als normaler User anmelden**
   - Prüfen: Sieht nur eigene/zugewiesene ToDos
   - Prüfen: Kann nur eigene ToDos bearbeiten
   - Prüfen: Kann Status von zugewiesenen ToDos ändern
   - Prüfen: Kann fremde ToDos NICHT löschen
   - Prüfen: Status-Dropdown ist disabled bei fremden ToDos

4. **Edge Cases**
   - User ist Assignee aber nicht Creator → Kann Status ändern
   - User ist weder Creator noch Assignee → Sieht ToDo nicht
   - User wechselt Company → Sieht andere ToDos

## Zusammenfassung

Die App verwendet **vollständige App-Level Security** da RLS zu Rekursionsproblemen führte. Alle Berechtigungen werden in der Anwendung geprüft.

⚠️ **Für Production muss noch Server-Side Validierung implementiert werden!**
