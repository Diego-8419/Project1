# 🚀 Deployment-Anleitung für Dummies

Diese Anleitung führt dich Schritt für Schritt durch das Deployment deiner ToDo-App, sodass du sie im Browser und als App testen kannst - **ohne dass andere darauf zugreifen können**.

---

## 📋 Übersicht - Was du brauchst

- ✅ **Vercel Account** (hast du bereits)
- ✅ **Supabase Account** (hast du bereits)
- ✅ **Domain** (hast du bereits gesichert)
- ⏳ **GitHub Repository** (muss mit Vercel verbunden werden)
- ⏳ **Environment Variables** (müssen gesetzt werden)

---

## Schritt 1: Supabase Production Datenbank einrichten

### 1.1 Neue Supabase Projekt erstellen (oder bestehendes nutzen)

1. Gehe zu [supabase.com](https://supabase.com) und melde dich an
2. Klicke auf **"New Project"** (oder nutze dein bestehendes Projekt)
3. Wähle einen **Namen** für dein Projekt (z.B. "todo-app-production")
4. Wähle eine **Region** aus:
   - **Frankfurt (eu-central-1)** für Deutschland
   - **London (eu-west-2)** für Europa
5. Setze ein **starkes Passwort** (speichere es sicher!)
6. Klicke auf **"Create new project"**

⏱️ **Warte 2-3 Minuten**, bis das Projekt erstellt ist.

### 1.2 Datenbank-Migrationen ausführen

1. Gehe in deinem Supabase-Projekt zu **"SQL Editor"** (linke Sidebar)
2. Klicke auf **"New query"**
3. Öffne auf deinem Computer die Datei: `supabase/migrations/001_initial_schema.sql`
4. **Kopiere den gesamten Inhalt** und füge ihn in den SQL Editor ein
5. Klicke auf **"RUN"** (oder drücke `Ctrl + Enter`)
6. ✅ Überprüfe, dass keine Fehler angezeigt werden

**Wiederhole das für alle Migrationsdateien in dieser Reihenfolge:**
- `001_initial_schema.sql` ✅
- `002_rls_policies.sql`
- `003_storage_setup.sql`

### 1.3 Storage Buckets einrichten

1. Gehe zu **"Storage"** (linke Sidebar)
2. Klicke auf **"Create a new bucket"**
3. Erstelle folgende Buckets:

   **Bucket 1: attachments**
   - Name: `attachments`
   - Public: **NEIN** (unchecked)
   - Klicke auf "Create bucket"

   **Bucket 2: documents**
   - Name: `documents`
   - Public: **NEIN** (unchecked)
   - Klicke auf "Create bucket"

   **Bucket 3: avatars**
   - Name: `avatars`
   - Public: **JA** (checked)
   - Klicke auf "Create bucket"

### 1.4 Supabase Environment Variables kopieren

1. Gehe zu **"Settings"** → **"API"** (linke Sidebar)
2. Kopiere folgende Werte und **speichere sie sicher**:

   ```
   Project URL: https://xxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (⚠️ GEHEIM!)
   ```

---

## Schritt 2: GitHub Repository vorbereiten

### 2.1 Code committen (falls noch nicht geschehen)

1. Öffne ein Terminal in deinem Projektordner
2. Führe folgende Befehle aus:

```bash
# Alle Änderungen hinzufügen
git add .

# Commit erstellen
git commit -m "feat: Add privacy checkbox and prepare for deployment"

# Push zu GitHub
git push origin main
```

### 2.2 Repository auf GitHub verifizieren

1. Gehe zu [github.com](https://github.com)
2. Öffne dein Repository
3. ✅ Überprüfe, dass alle Dateien vorhanden sind (insbesondere `src/`, `package.json`, etc.)

---

## Schritt 3: Vercel Deployment

### 3.1 Projekt in Vercel importieren

1. Gehe zu [vercel.com](https://vercel.com) und melde dich an
2. Klicke auf **"Add New..."** → **"Project"**
3. Wähle dein **GitHub Repository** aus (z.B. "todo-app" oder "Project1")
4. Klicke auf **"Import"**

### 3.2 Environment Variables setzen

**WICHTIG:** Bevor du auf "Deploy" klickst, setze die Environment Variables!

1. Scrolle zu **"Environment Variables"**
2. Füge folgende Variablen hinzu (nutze die Werte aus Schritt 1.4):

   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxxx.supabase.co` | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production |

   **So fügst du eine Variable hinzu:**
   - Klicke auf **"Add"** oder die erste leere Zeile
   - Gib den **Name** ein (z.B. `NEXT_PUBLIC_SUPABASE_URL`)
   - Gib den **Value** ein (z.B. `https://xxxxxxxxx.supabase.co`)
   - Wähle die **Environments** aus (klicke auf die Checkboxen)
   - Klicke auf **"Add"** oder die nächste Zeile

3. ✅ Überprüfe, dass alle 3 Variablen hinzugefügt wurden

### 3.3 Build Settings

Diese sollten automatisch erkannt werden, aber überprüfe:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (leer lassen, Vercel erkennt es automatisch)
- **Install Command:** `npm install`

### 3.4 Deployment starten

1. Klicke auf **"Deploy"**
2. ⏱️ Warte 2-5 Minuten, bis das Deployment abgeschlossen ist
3. ✅ Du solltest "Congratulations" sehen mit einer Deployment-URL (z.B. `https://your-app.vercel.app`)

---

## Schritt 4: Domain mit Vercel verbinden

### 4.1 Domain in Vercel hinzufügen

1. Gehe in deinem Vercel-Projekt zu **"Settings"** → **"Domains"**
2. Gib deine **Domain** ein (z.B. `meine-todo-app.de`)
3. Klicke auf **"Add"**

### 4.2 DNS-Einträge konfigurieren

Vercel zeigt dir jetzt, welche DNS-Einträge du setzen musst. Das sieht ungefähr so aus:

**Option A: A Record (empfohlen)**
```
Type: A
Name: @ (oder leer)
Value: 76.76.21.21
```

**Option B: CNAME Record**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 4.3 DNS bei deinem Domain-Anbieter setzen

1. Logge dich bei deinem Domain-Anbieter ein (z.B. Namecheap, GoDaddy, Strato, etc.)
2. Gehe zu **DNS Settings** oder **DNS Management**
3. Füge die DNS-Einträge hinzu (A Record + CNAME, wie von Vercel angezeigt)
4. Speichere die Änderungen

⏱️ **Warte 10 Minuten bis 48 Stunden**, bis die DNS-Propagation abgeschlossen ist.

### 4.4 SSL-Zertifikat

Vercel erstellt **automatisch** ein kostenloses SSL-Zertifikat von Let's Encrypt. Das kann 1-2 Stunden dauern.

✅ Du siehst ein **grünes Schloss** in deiner URL-Leiste, sobald SSL aktiv ist.

---

## Schritt 5: Supabase URL Whitelist

### 5.1 Vercel-URLs in Supabase erlauben

1. Gehe zu deinem Supabase-Projekt
2. Gehe zu **"Authentication"** → **"URL Configuration"**
3. Füge folgende URLs hinzu:

   **Site URL:**
   ```
   https://meine-todo-app.de
   ```

   **Redirect URLs (füge beide hinzu):**
   ```
   https://meine-todo-app.de/**
   https://your-app.vercel.app/**
   ```

4. Klicke auf **"Save"**

---

## Schritt 6: App privat halten (nur für Tests)

### 6.1 Vercel Deployment Protection aktivieren

1. Gehe in Vercel zu **"Settings"** → **"Deployment Protection"**
2. Aktiviere **"Protection Mode"**
3. Wähle **"Password Protection"**
4. Setze ein **Passwort** (z.B. `testpasswort123`)
5. Klicke auf **"Save"**

✅ Jetzt kann **niemand** die App öffnen, ohne das Passwort zu kennen!

### 6.2 Public Registration deaktivieren

Die App ist bereits so konfiguriert, dass öffentliche Registrierungen deaktiviert werden können.

1. Öffne die Datei: `src/config/features.ts`
2. Setze `ALLOW_PUBLIC_REGISTRATION` auf `false`:

```typescript
export const FEATURES = {
  ALLOW_PUBLIC_REGISTRATION: false, // ← Ändern auf false
}
```

3. Committe und pushe die Änderung:

```bash
git add src/config/features.ts
git commit -m "feat: Disable public registration for testing"
git push origin main
```

Vercel wird **automatisch** ein neues Deployment starten.

---

## Schritt 7: Ersten Admin-User erstellen

### 7.1 User in Supabase manuell erstellen

1. Gehe zu deinem Supabase-Projekt
2. Gehe zu **"Authentication"** → **"Users"**
3. Klicke auf **"Add user"** → **"Create new user"**
4. Fülle die Felder aus:
   - **Email:** deine@email.de
   - **Password:** SicheresPasswort123!
   - **Auto Confirm User:** ✅ JA (aktiviert)
5. Klicke auf **"Create user"**

### 7.2 User zu `user_profiles` hinzufügen

1. Gehe zu **"Table Editor"** → **"user_profiles"**
2. Klicke auf **"Insert"** → **"Insert row"**
3. Fülle die Felder aus:
   - **id:** (kopiere die User-ID aus dem vorherigen Schritt)
   - **email:** deine@email.de
   - **full_name:** Dein Name
4. Klicke auf **"Save"**

---

## Schritt 8: App testen

### 8.1 Im Browser testen

1. Öffne deine Domain: `https://meine-todo-app.de`
2. Gib das **Vercel-Passwort** ein (falls Protection aktiviert)
3. Melde dich mit deinem **Admin-User** an
4. ✅ Teste alle Funktionen:
   - Firma erstellen
   - ToDo erstellen
   - Mitglieder hinzufügen
   - Kommentare schreiben
   - Dateien hochladen

### 8.2 Als PWA installieren (Mobile)

**Auf Android (Chrome):**
1. Öffne die App in Chrome
2. Tippe auf das **3-Punkte-Menü** (oben rechts)
3. Wähle **"Zum Startbildschirm hinzufügen"**
4. Bestätige mit **"Hinzufügen"**
5. ✅ Das App-Icon erscheint auf dem Homescreen

**Auf iOS (Safari):**
1. Öffne die App in Safari
2. Tippe auf das **Teilen-Icon** (unten, Viereck mit Pfeil)
3. Scrolle nach unten und wähle **"Zum Home-Bildschirm"**
4. Bestätige mit **"Hinzufügen"**
5. ✅ Das App-Icon erscheint auf dem Homescreen

### 8.3 Offline-Modus testen

1. Öffne die App
2. Schalte dein **WLAN/Mobile Daten aus**
3. ✅ Die App sollte trotzdem die Startseite laden
4. ⚠️ Neue Daten können nicht geladen werden (das ist normal)

---

## Schritt 9: Datenschutzerklärung aktualisieren

### 9.1 Echte Daten eintragen

1. Öffne die Datei: `src/app/datenschutz/page.tsx`
2. Ersetze **ALLE Platzhalter** mit echten Daten:
   - `[Dein Name/Firma]` → z.B. "Max Mustermann GmbH"
   - `[Deine Adresse]` → z.B. "Musterstraße 123, 12345 Musterstadt"
   - `[Deine E-Mail]` → z.B. "datenschutz@meine-firma.de"
   - `[Deine Telefonnummer]` → z.B. "+49 123 456789"
3. Speichere die Datei
4. Committe und pushe:

```bash
git add src/app/datenschutz/page.tsx
git commit -m "docs: Update privacy policy with real data"
git push origin main
```

### 9.2 Impressum aktualisieren

1. Öffne die Datei: `src/app/impressum/page.tsx`
2. Ersetze **ALLE Platzhalter** mit echten Daten
3. Committe und pushe (wie oben)

---

## Schritt 10: Monitoring & Fehlersuche

### 10.1 Logs in Vercel überprüfen

1. Gehe zu deinem Vercel-Projekt
2. Klicke auf **"Deployments"**
3. Klicke auf das neueste Deployment
4. Klicke auf **"Functions"** → Wähle eine Funktion aus
5. ✅ Überprüfe die Logs auf Fehler

### 10.2 Supabase Logs überprüfen

1. Gehe zu deinem Supabase-Projekt
2. Gehe zu **"Logs"** (linke Sidebar)
3. Wähle **"Postgres Logs"** oder **"API Logs"**
4. ✅ Überprüfe auf Fehler

---

## ✅ Checkliste: Ist alles fertig?

- [ ] Supabase Datenbank mit Migrationen eingerichtet
- [ ] Storage Buckets erstellt (attachments, documents, avatars)
- [ ] Environment Variables in Vercel gesetzt
- [ ] Deployment erfolgreich auf Vercel
- [ ] Domain mit Vercel verbunden
- [ ] SSL-Zertifikat aktiv (grünes Schloss)
- [ ] Supabase URL Whitelist aktualisiert
- [ ] Vercel Deployment Protection aktiviert (optional)
- [ ] Public Registration deaktiviert
- [ ] Erster Admin-User erstellt
- [ ] App im Browser getestet
- [ ] PWA auf Mobile installiert und getestet
- [ ] Datenschutzerklärung mit echten Daten aktualisiert
- [ ] Impressum mit echten Daten aktualisiert
- [ ] Datenschutz-Checkbox beim Login funktioniert

---

## 🆘 Hilfe bei Problemen

### Problem: "Error: Could not connect to database"
**Lösung:**
1. Überprüfe, ob die `NEXT_PUBLIC_SUPABASE_URL` korrekt ist
2. Überprüfe, ob die Supabase-Datenbank läuft (grüner Status in Supabase Dashboard)

### Problem: "Authentication Error"
**Lösung:**
1. Überprüfe die Supabase URL Whitelist
2. Lösche Browser-Cache und Cookies
3. Überprüfe, ob der User in `user_profiles` existiert

### Problem: "Build failed on Vercel"
**Lösung:**
1. Überprüfe die Build-Logs in Vercel
2. Stelle sicher, dass alle Environment Variables gesetzt sind
3. Teste den Build lokal: `npm run build`

### Problem: "PWA installiert sich nicht"
**Lösung:**
1. Überprüfe, ob `manifest.json` existiert
2. Überprüfe, ob HTTPS aktiv ist (kein HTTP!)
3. Öffne Browser-Entwicklertools → Application → Manifest

---

## 📞 Support

Falls du weitere Hilfe brauchst:
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

**Viel Erfolg beim Deployment! 🚀**
