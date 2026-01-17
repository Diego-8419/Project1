# Supabase Region ändern - Schnellanleitung

## Schritt 1: Neues Projekt erstellen

1. Gehe zu [app.supabase.com](https://app.supabase.com)
2. Klicke auf **"New Project"**
3. Fülle die Felder aus:
   - **Name:** `todo-app-production` (oder ein anderer Name)
   - **Database Password:** Generiere ein sicheres Passwort (speichere es!)
   - **Region:** Wähle **Frankfurt (eu-central-1)** ✅
   - **Pricing Plan:** Free (für Tests) oder Pro (für Production)
4. Klicke auf **"Create new project"**
5. ⏱️ Warte 2-3 Minuten

---

## Schritt 2: Database Migrations ausführen

### 2.1 SQL Editor öffnen
1. Gehe im neuen Projekt zu **"SQL Editor"** (linke Sidebar)
2. Klicke auf **"New query"**

### 2.2 Migration 001 - Schema
1. Öffne lokal: `supabase/migrations/001_initial_schema.sql`
2. Kopiere den **gesamten Inhalt**
3. Füge ihn in den SQL Editor ein
4. Klicke auf **"RUN"** (oder `Ctrl + Enter`)
5. ✅ Überprüfe: "Success. No rows returned"

### 2.3 Migration 002 - RLS Policies
1. Öffne lokal: `supabase/migrations/002_rls_policies.sql`
2. Kopiere den **gesamten Inhalt**
3. Füge ihn in den SQL Editor ein
4. Klicke auf **"RUN"**
5. ✅ Überprüfe: Keine Fehler

### 2.4 Migration 003 - Storage Setup
1. Öffne lokal: `supabase/migrations/003_storage_setup.sql`
2. Kopiere den **gesamten Inhalt**
3. Füge ihn in den SQL Editor ein
4. Klicke auf **"RUN"**
5. ✅ Überprüfe: Keine Fehler

---

## Schritt 3: Storage Buckets erstellen

1. Gehe zu **"Storage"** (linke Sidebar)
2. Klicke auf **"Create a new bucket"**

### Bucket 1: attachments
- Name: `attachments`
- Public: **NO** ❌ (unchecked)
- Click "Create bucket"

### Bucket 2: documents
- Name: `documents`
- Public: **NO** ❌ (unchecked)
- Click "Create bucket"

### Bucket 3: avatars
- Name: `avatars`
- Public: **YES** ✅ (checked)
- Click "Create bucket"

---

## Schritt 4: Environment Variables kopieren

1. Gehe zu **"Settings"** → **"API"**
2. Kopiere folgende Werte:

```
Project URL: https://xxxxxxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (⚠️ GEHEIM!)
```

---

## Schritt 5: Environment Variables in Vercel aktualisieren

### 5.1 Lokal aktualisieren (.env.local)
1. Öffne `.env.local` in deinem Projektordner
2. Aktualisiere die Werte:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://NEUE-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEUE_ANON_KEY...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEUE_SERVICE_KEY...
```

3. Speichern

### 5.2 In Vercel aktualisieren
1. Gehe zu [vercel.com](https://vercel.com)
2. Öffne dein Projekt
3. Gehe zu **"Settings"** → **"Environment Variables"**
4. Für jede Variable:
   - Klicke auf das **3-Punkte-Menü** → **"Edit"**
   - Füge den **neuen Wert** ein
   - Klicke auf **"Save"**

**Variablen aktualisieren:**
- `NEXT_PUBLIC_SUPABASE_URL` → Neue Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Neuer anon key
- `SUPABASE_SERVICE_ROLE_KEY` → Neuer service_role key

5. **Redeploy triggern:**
   - Gehe zu **"Deployments"**
   - Klicke beim letzten Deployment auf **"..."** → **"Redeploy"**
   - Warte 2-3 Minuten

---

## Schritt 6: Lokal testen

1. Stoppe den Dev-Server (falls er läuft)
2. Starte neu:

```bash
npm run dev
```

3. Öffne http://localhost:3000
4. ✅ Teste Login/Registrierung

---

## Schritt 7: Altes Projekt löschen (optional)

**Nur wenn du sicher bist, dass das neue Projekt funktioniert!**

1. Gehe zum alten Supabase-Projekt
2. Gehe zu **"Settings"** → **"General"**
3. Scrolle nach unten zu **"Danger Zone"**
4. Klicke auf **"Delete project"**
5. Bestätige mit dem Projekt-Namen
6. Klicke auf **"I understand, delete this project"**

---

## ✅ Checkliste

- [ ] Neues Supabase-Projekt in Frankfurt erstellt
- [ ] Migration 001 ausgeführt
- [ ] Migration 002 ausgeführt
- [ ] Migration 003 ausgeführt
- [ ] Storage Buckets erstellt (attachments, documents, avatars)
- [ ] Environment Variables kopiert
- [ ] `.env.local` lokal aktualisiert
- [ ] Environment Variables in Vercel aktualisiert
- [ ] Vercel Redeploy getriggert
- [ ] Lokal getestet
- [ ] Altes Projekt gelöscht (optional)

---

## 🆘 Probleme?

### "Migration failed: relation already exists"
**Lösung:** Lösche das Projekt und erstelle es neu.

### "RLS policy already exists"
**Lösung:** Überspringe die Fehler, wenn die Policies bereits existieren.

### "Storage bucket already exists"
**Lösung:** Das ist OK, die Buckets wurden bereits erstellt.

---

**Fertig! 🎉** Dein neues Projekt läuft jetzt in Frankfurt!
