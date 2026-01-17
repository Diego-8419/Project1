# 📝 Datenschutzerklärung & Impressum - Anleitung zum Ausfüllen

## 🎯 Was musst du ersetzen?

In beiden Dateien gibt es Platzhalter in **eckigen Klammern `[...]`**, die du mit deinen echten Daten ersetzen musst.

---

## 1️⃣ Datenschutzerklärung ausfüllen

**Datei:** `src/app/(auth)/datenschutz/page.tsx`

### Schritt 1: Öffne die Datei
- Navigiere zu: `src/app/(auth)/datenschutz/page.tsx`
- Oder nutze VS Code Suche (`Ctrl + P`) und tippe: `datenschutz/page.tsx`

### Schritt 2: Ersetze die Platzhalter (Zeilen 30-36)

Suche nach dieser Stelle (ca. Zeile 30):

```tsx
<strong>[FIRMENNAME]</strong><br />
[Straße und Hausnummer]<br />
[PLZ und Ort]<br />
[Land]<br />
<br />
E-Mail: [E-Mail-Adresse]<br />
Telefon: [Telefonnummer]
```

**Ersetze mit deinen echten Daten:**

```tsx
<strong>Muster GmbH</strong><br />
Musterstraße 123<br />
12345 Musterstadt<br />
Deutschland<br />
<br />
E-Mail: datenschutz@meine-firma.de<br />
Telefon: +49 123 456789
```

### Schritt 3: Datum aktualisieren (optional)

Suche nach (ca. Zeile 289):

```tsx
Diese Datenschutzerklärung ist aktuell gültig und hat den Stand: Januar 2026.
```

Ersetze mit dem aktuellen Datum:

```tsx
Diese Datenschutzerklärung ist aktuell gültig und hat den Stand: Januar 2026.
```

### Schritt 4: Speichern
- Drücke `Ctrl + S` (oder `Cmd + S` auf Mac)

✅ **Fertig!** Die Datenschutzerklärung ist jetzt ausgefüllt.

---

## 2️⃣ Impressum ausfüllen

**Datei:** `src/app/(auth)/impressum/page.tsx`

### Schritt 1: Öffne die Datei
- Navigiere zu: `src/app/(auth)/impressum/page.tsx`
- Oder nutze VS Code Suche (`Ctrl + P`) und tippe: `impressum/page.tsx`

### Schritt 2: Suche nach Platzhaltern

Das Impressum enthält wahrscheinlich ähnliche Platzhalter wie:

```tsx
[FIRMENNAME]
[Straße und Hausnummer]
[PLZ und Ort]
[Land]
[E-Mail-Adresse]
[Telefonnummer]
[Geschäftsführer/Inhaber]
[Handelsregister-Nummer]
[USt-IdNr.]
```

### Schritt 3: Ersetze alle Platzhalter

**Beispiel:**

```tsx
<strong>Muster GmbH</strong><br />
Musterstraße 123<br />
12345 Musterstadt<br />
Deutschland<br />
<br />
E-Mail: info@meine-firma.de<br />
Telefon: +49 123 456789<br />
<br />
Geschäftsführer: Max Mustermann<br />
Handelsregister: HRB 12345, Amtsgericht Musterstadt<br />
USt-IdNr.: DE123456789
```

### Schritt 4: Speichern
- Drücke `Ctrl + S`

✅ **Fertig!** Das Impressum ist jetzt ausgefüllt.

---

## 🔍 Wie finde ich alle Platzhalter?

### Methode 1: Suchen & Ersetzen in VS Code

1. Öffne VS Code
2. Drücke `Ctrl + H` (Suchen & Ersetzen)
3. Gib in "Suchen" ein: `\[.*?\]` (Regex-Modus aktivieren!)
4. Das findet alle Platzhalter in eckigen Klammern
5. Ersetze jeden einzeln mit deinen Daten

### Methode 2: Manuell durchsuchen

1. Öffne die Datei
2. Nutze `Ctrl + F` (Suchen)
3. Suche nach: `[`
4. Springe mit `F3` (Nächstes Vorkommen) durch alle Platzhalter

---

## 📋 Checkliste

### Datenschutzerklärung (`datenschutz/page.tsx`)
- [ ] `[FIRMENNAME]` → Deine Firma
- [ ] `[Straße und Hausnummer]` → Deine Adresse
- [ ] `[PLZ und Ort]` → Deine Stadt
- [ ] `[Land]` → Deutschland (oder dein Land)
- [ ] `[E-Mail-Adresse]` → Deine E-Mail
- [ ] `[Telefonnummer]` → Deine Telefon-Nummer
- [ ] Datum aktualisiert (optional)

### Impressum (`impressum/page.tsx`)
- [ ] `[FIRMENNAME]` → Deine Firma
- [ ] `[Straße und Hausnummer]` → Deine Adresse
- [ ] `[PLZ und Ort]` → Deine Stadt
- [ ] `[Land]` → Deutschland (oder dein Land)
- [ ] `[E-Mail-Adresse]` → Deine E-Mail
- [ ] `[Telefonnummer]` → Deine Telefon-Nummer
- [ ] `[Geschäftsführer/Inhaber]` → Name des Geschäftsführers
- [ ] `[Handelsregister-Nummer]` → HRB xxxxx (falls vorhanden)
- [ ] `[USt-IdNr.]` → DExxxxxxxxx (falls vorhanden)

---

## ⚠️ Wichtige Hinweise

### 1. Pflichtangaben im Impressum (Deutschland)

Für **Unternehmen** (GmbH, UG, AG, etc.):
- Firmenname (vollständig, wie im Handelsregister)
- Rechtsform (z.B. GmbH)
- Geschäftsanschrift (kein Postfach!)
- Vertretungsberechtigte Personen (Geschäftsführer)
- Kontaktdaten (E-Mail, Telefon)
- Handelsregister-Nummer und Registergericht
- Umsatzsteuer-Identifikationsnummer (USt-IdNr.)

Für **Einzelunternehmer/Freiberufler**:
- Vollständiger Name
- Anschrift
- Kontaktdaten (E-Mail, Telefon)
- ggf. Berufsbezeichnung
- ggf. zuständige Aufsichtsbehörde
- ggf. USt-IdNr.

### 2. Datenschutzbeauftragter

Falls du **mehr als 20 Mitarbeiter** hast, die regelmäßig mit personenbezogenen Daten arbeiten, benötigst du einen **Datenschutzbeauftragten** (DSB).

Wenn ja, ergänze in der Datenschutzerklärung:

```tsx
<h3>Datenschutzbeauftragter:</h3>
<p>
  [Name des Datenschutzbeauftragten]<br />
  E-Mail: datenschutz@meine-firma.de
</p>
```

### 3. E-Mail-Adressen

Empfehlung für professionelle E-Mail-Adressen:
- **Datenschutz:** `datenschutz@deine-domain.de`
- **Impressum/Kontakt:** `info@deine-domain.de` oder `kontakt@deine-domain.de`

### 4. Telefonnummer

Format: `+49 123 456789` (internationale Schreibweise)

---

## ✅ Nach dem Ausfüllen

1. **Speichere beide Dateien** (`Ctrl + S`)
2. **Committe die Änderungen**:
   ```bash
   git add src/app/\(auth\)/datenschutz/page.tsx src/app/\(auth\)/impressum/page.tsx
   git commit -m "docs: Update privacy policy and imprint with real data"
   ```
3. **Teste lokal**:
   ```bash
   npm run dev
   ```
   Öffne: http://localhost:3000/datenschutz und http://localhost:3000/impressum

4. **Pushe zu GitHub**:
   ```bash
   git push origin main
   ```

---

## 🆘 Probleme?

### "Ich finde die Datei nicht"

Pfade nochmal:
- Datenschutz: `src/app/(auth)/datenschutz/page.tsx`
- Impressum: `src/app/(auth)/impressum/page.tsx`

Achtung: `(auth)` ist ein **Ordner** mit Klammern im Namen!

### "Wie öffne ich die Datei in VS Code?"

1. Drücke `Ctrl + P`
2. Tippe: `datenschutz/page`
3. Drücke `Enter`

### "Welche Daten muss ich verwenden?"

**Für Tests/Development:**
- Nutze **Beispieldaten** (Muster GmbH, etc.)
- **WICHTIG:** Vor dem echten Go-Live **echte Daten** eintragen!

**Für Production:**
- **Echte Firmendaten** verwenden
- **Echte Kontaktdaten** (E-Mail, Telefon)
- **Rechtlich korrekte Angaben**

---

**Fertig! 🎉** Nachdem du die Platzhalter ersetzt hast, sind Datenschutzerklärung und Impressum bereit für das Deployment.
