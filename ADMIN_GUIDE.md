# Administrator Leitfaden

## Übersicht

Diese Anwendung ist als **geschlossenes System** konfiguriert, bei dem nur Administratoren Benutzer einladen und Firmen erstellen können.

## Benutzer-Einladung (Aktueller Prozess)

### Schritt 1: Benutzer registriert sich

Der neue Benutzer (z.B. Max Mustermann) muss sich zunächst selbst registrieren:

1. Gehe zu `/register`
2. **WICHTIG**: Aktuell ist die Registrierung deaktiviert (`ALLOW_PUBLIC_REGISTRATION = false`)
3. Um Max Mustermann anzulegen, müssen Sie temporär in [src/config/features.ts](src/config/features.ts) ändern:
   ```typescript
   ALLOW_PUBLIC_REGISTRATION: true  // Temporär aktivieren
   ```
4. Max registriert sich mit E-Mail und Passwort
5. **Sofort wieder deaktivieren**:
   ```typescript
   ALLOW_PUBLIC_REGISTRATION: false
   ```

### Schritt 2: Admin lädt Benutzer zur Firma ein

1. Gehen Sie zur Members-Seite Ihrer Firma: `/[firma-slug]/settings/members`
2. Klicken Sie auf "Mitglied hinzufügen"
3. Geben Sie die E-Mail-Adresse des Benutzers ein (z.B. `max.mustermann@example.com`)
4. Wählen Sie die Rolle:
   - **Benutzer**: Sieht nur zugewiesene ToDos
   - **Geschäftsleitung (GL)**: Sieht alle ToDos der Firma
   - **Administrator**: Vollzugriff, kann Firmen erstellen

5. Der Benutzer erscheint sofort in der Mitgliederliste

### Schritt 3: Benutzer meldet sich an

1. Max Mustermann meldet sich an
2. Er sieht auf `/dashboard` alle Firmen, denen er zugewiesen ist
3. Er kann die Firma auswählen und arbeiten

## Rollen-System

### Ein Benutzer kann unterschiedliche Rollen in verschiedenen Firmen haben

**Beispiel: Max Mustermann**
- In **Firma A** (test1): `user` (normaler Benutzer)
- In **Firma B** (test2): `gl` (Geschäftsleitung)
- In **Firma C** (max-firma): `admin` (er hat sie selbst erstellt)

### Rollen-Änderung

Als Admin können Sie die Rolle eines Mitglieds jederzeit ändern:

1. Gehen Sie zur Members-Seite
2. Wählen Sie im Dropdown neben dem Namen die neue Rolle
3. Die Änderung wird sofort gespeichert

**Hinweis**: Sie können Ihre eigene Rolle nicht ändern.

## Firmen-Verwaltung

### Neue Firma erstellen

1. Als Admin gehen Sie zu `/dashboard`
2. Klicken Sie auf "Neue Firma erstellen"
3. Geben Sie den Firmennamen ein
4. Sie werden automatisch als Admin der Firma hinzugefügt

### Mitglieder verwalten

Auf der Members-Seite (`/[firma-slug]/settings/members`) können Sie:

- ✅ Neue Mitglieder hinzufügen (per E-Mail)
- ✅ Rollen ändern
- ✅ Mitglieder entfernen
- ❌ Sich selbst nicht entfernen (Sicherheit)
- ❌ Eigene Rolle nicht ändern (Sicherheit)

## Feature Flags

In [src/config/features.ts](src/config/features.ts) können Sie das Verhalten der App steuern:

### `ALLOW_PUBLIC_REGISTRATION`

```typescript
ALLOW_PUBLIC_REGISTRATION: false  // EMPFOHLEN
```

- **false**: Registrierung ist deaktiviert. Benutzer sehen eine Meldung, dass sie einen Admin kontaktieren müssen.
- **true**: Jeder kann sich registrieren (benötigt E-Mail-Verifizierung und Captcha für Production!)

### `ALLOW_USER_CREATE_COMPANY`

```typescript
ALLOW_USER_CREATE_COMPANY: false  // EMPFOHLEN
```

- **false**: Nur Admins können Firmen erstellen
- **true**: Jeder Benutzer kann seine eigene Firma erstellen

## Sicherheitshinweise

### ⚠️ WICHTIG: RLS ist deaktiviert!

Die Datenbank-Row-Level-Security (RLS) ist deaktiviert (siehe [SECURITY.md](SECURITY.md)).

Das bedeutet:
- ✅ Berechtigungen werden auf App-Ebene geprüft
- ⚠️ Böswillige Benutzer könnten direkt auf die Datenbank zugreifen
- ⚠️ Für Production: Server-Side API Routes mit Validierung implementieren

### Aktuelle Sicherheitsmaßnahmen

1. **App-Level Permissions**: Siehe [src/lib/utils/permissions.ts](src/lib/utils/permissions.ts)
2. **Feature Flags**: Registrierung und Firmen-Erstellung sind deaktiviert
3. **Rollen-basierte Zugriffskontrolle**: Admin/GL/User Rollen werden geprüft

### Für Production erforderlich

- [ ] Server-Side API Routes für alle Schreiboperationen
- [ ] Input-Validierung auf Server
- [ ] Rate Limiting
- [ ] E-Mail-Verifizierung
- [ ] Captcha für Registrierung
- [ ] Audit Logging
- [ ] RLS wieder aktivieren ODER sehr strikte Server-Side Validierung

## Workflow: Neuen Benutzer einladen

### Option A: Temporäre Registrierung (Aktuell)

1. Setzen Sie `ALLOW_PUBLIC_REGISTRATION: true`
2. Teilen Sie dem Benutzer den Registrierungs-Link mit
3. Benutzer registriert sich
4. Setzen Sie `ALLOW_PUBLIC_REGISTRATION: false` zurück
5. Laden Sie den Benutzer zur Firma ein über Members-Seite
6. Teilen Sie dem Benutzer mit, dass er sich anmelden kann

### Option B: Admin erstellt Account (TODO - Zukünftig)

Zukünftig könnte implementiert werden:

1. Admin erstellt Benutzer-Account direkt
2. Temporäres Passwort wird generiert
3. E-Mail mit Login-Daten wird versendet
4. Benutzer muss Passwort beim ersten Login ändern

## Häufige Aufgaben

### Benutzer zu mehreren Firmen hinzufügen

1. Wechseln Sie zur ersten Firma: `/firma1/settings/members`
2. Fügen Sie Benutzer hinzu mit Rolle A
3. Wechseln Sie zur zweiten Firma: `/firma2/settings/members`
4. Fügen Sie denselben Benutzer hinzu mit Rolle B
5. Der Benutzer sieht beide Firmen auf `/dashboard` und kann zwischen ihnen wechseln

### Benutzer komplett entfernen

Sie müssen den Benutzer aus **allen** Firmen entfernen:

1. Gehen Sie zu jeder Firma
2. Öffnen Sie Members-Seite
3. Klicken Sie auf "Entfernen" neben dem Benutzer
4. Der Benutzer kann sich noch anmelden, sieht aber "Keine Firmen gefunden"

### Rolle eines Benutzers ändern

1. Öffnen Sie Members-Seite der entsprechenden Firma
2. Wählen Sie im Dropdown die neue Rolle
3. Änderung ist sofort aktiv
4. Benutzer sieht die neuen Berechtigungen beim nächsten Seitenwechsel

## Troubleshooting

### "Benutzer mit dieser E-Mail existiert nicht"

Der Benutzer muss sich erst registrieren. Aktivieren Sie temporär die Registrierung.

### "Benutzer ist bereits Mitglied dieser Firma"

Der Benutzer wurde bereits hinzugefügt. Ändern Sie stattdessen die Rolle über das Dropdown.

### "Keine Berechtigung"

Nur Admins und GL können Mitglieder verwalten. Prüfen Sie Ihre Rolle auf der Members-Seite.

### Benutzer sieht keine Firmen

Der Benutzer wurde noch keiner Firma zugewiesen. Fügen Sie ihn über die Members-Seite hinzu.

## Später: Öffentliche Registrierung aktivieren

Wenn Sie die App später für öffentliche Nutzung öffnen möchten:

1. **E-Mail-Verifizierung implementieren**
   - Supabase Email Templates konfigurieren
   - Bestätigungs-Flow implementieren

2. **Captcha hinzufügen**
   - reCAPTCHA oder hCaptcha integrieren
   - Spam-Schutz implementieren

3. **Feature Flags ändern**
   ```typescript
   ALLOW_PUBLIC_REGISTRATION: true
   ALLOW_USER_CREATE_COMPANY: true  // Optional
   ```

4. **Server-Side Security implementieren**
   - API Routes mit Validierung
   - Rate Limiting
   - Input Sanitization

5. **Terms & Privacy Policy**
   - Nutzungsbedingungen erstellen
   - Datenschutzerklärung hinzufügen
   - Zustimmungs-Checkbox bei Registrierung
