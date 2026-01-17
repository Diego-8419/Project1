# Migration 023 ausführen

## Anleitung

1. Gehe zu https://supabase.com/dashboard/project/lgjmpnqfoaeccdouvddf
2. Klicke auf "SQL Editor" in der linken Navigation
3. Klicke auf "New Query"
4. Kopiere den Inhalt von `supabase/migrations/023_add_superuser_and_status_notes.sql`
5. Füge ihn in den SQL Editor ein
6. Klicke auf "Run"

## Was wird geändert:

- ✅ Neue Rolle "superuser" wird hinzugefügt
- ✅ Tabelle `superuser_permissions` für granulare Sichtbarkeitsrechte
- ✅ Spalten für Status-Notes in `todos` und `subtasks`
- ✅ Archiv-Spalten in `todos`
- ✅ Indizes für Performance

## Nach der Migration:

Die App kann weiterhin normal genutzt werden. Die neuen Features werden schrittweise aktiviert.
