'use client'

/**
 * Datenschutzerklärung
 * DSGVO-konforme Datenschutzinformationen
 */

import Link from 'next/link'

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Datenschutzerklärung
          </h1>

          <div className="prose dark:prose-invert max-w-none">
            {/* 1. Verantwortlicher */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Verantwortlicher für die Datenverarbeitung
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>[Moritz Dickmann]</strong><br />
                  [Hengsteyer Straße 103]<br />
                  [58099 Hagen]<br />
                  [Deutschland]<br />
                  <br />
                  E-Mail: [info@agrias.de]<br />
                  Telefon: [015161642976]
                </p>
              </div>
            </section>

            {/* 2. Allgemeines */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Allgemeines zur Datenverarbeitung
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                2.1 Umfang der Verarbeitung personenbezogener Daten
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit dies zur Bereitstellung einer funktionsfähigen Anwendung sowie unserer Inhalte und Leistungen erforderlich ist. Die Verarbeitung personenbezogener Daten unserer Nutzer erfolgt regelmäßig nur nach Einwilligung des Nutzers.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                2.2 Rechtsgrundlage für die Verarbeitung
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Soweit wir für Verarbeitungsvorgänge personenbezogener Daten eine Einwilligung der betroffenen Person einholen, dient Art. 6 Abs. 1 lit. a EU-Datenschutzgrundverordnung (DSGVO) als Rechtsgrundlage.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Bei der Verarbeitung von personenbezogenen Daten, die zur Erfüllung eines Vertrages erforderlich ist, dient Art. 6 Abs. 1 lit. b DSGVO als Rechtsgrundlage.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Soweit eine Verarbeitung personenbezogener Daten zur Erfüllung einer rechtlichen Verpflichtung erforderlich ist, dient Art. 6 Abs. 1 lit. c DSGVO als Rechtsgrundlage.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Ist die Verarbeitung zur Wahrung eines berechtigten Interesses unseres Unternehmens oder eines Dritten erforderlich, dient Art. 6 Abs. 1 lit. f DSGVO als Rechtsgrundlage.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                2.3 Datenlöschung und Speicherdauer
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Die personenbezogenen Daten der betroffenen Person werden gelöscht oder gesperrt, sobald der Zweck der Speicherung entfällt. Eine Speicherung kann darüber hinaus erfolgen, wenn dies durch den europäischen oder nationalen Gesetzgeber in unionsrechtlichen Verordnungen, Gesetzen oder sonstigen Vorschriften vorgesehen wurde.
              </p>
            </section>

            {/* 3. Registrierung */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Registrierung und Nutzerkonto
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                3.1 Beschreibung und Umfang der Datenverarbeitung
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Bei der Registrierung werden folgende Daten erhoben:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>E-Mail-Adresse (verpflichtend)</li>
                <li>Passwort (verschlüsselt gespeichert)</li>
                <li>Name (optional)</li>
                <li>Zeitpunkt der Registrierung</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                3.2 Rechtsgrundlage
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO zur Vertragserfüllung bzw. zur Durchführung vorvertraglicher Maßnahmen.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                3.3 Zweck der Datenverarbeitung
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Die Registrierung ist für die Nutzung unserer Anwendung erforderlich. Die Daten werden verwendet, um:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>Ihnen Zugang zur Anwendung zu gewähren</li>
                <li>Ihre Identität zu verifizieren</li>
                <li>ToDos und Dokumente Ihrem Konto zuzuordnen</li>
                <li>Mit Ihnen zu kommunizieren</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                3.4 Speicherdauer
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Die Daten werden gespeichert, solange das Nutzerkonto besteht. Sie können Ihr Konto jederzeit löschen.
              </p>
            </section>

            {/* 4. Verarbeitete Daten */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Während der Nutzung verarbeitete Daten
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Bei der Nutzung unserer Anwendung werden folgende Daten verarbeitet:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li><strong>ToDos:</strong> Titel, Beschreibung, Status, Priorität, Deadline, Zuweisungen</li>
                <li><strong>Subtasks:</strong> Titel, Beschreibung, Status, Zuweisungen</li>
                <li><strong>Kommentare:</strong> Kommentartext, Zeitstempel</li>
                <li><strong>Dokumente:</strong> Dateiname, Dateigröße, Beschreibung, Hochladezeitpunkt</li>
                <li><strong>Benachrichtigungen:</strong> Benachrichtigungstext, Lesestatus</li>
                <li><strong>Aktivitätsprotokolle:</strong> Änderungen an ToDos, Zeitstempel</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Diese Daten werden nur innerhalb Ihrer Firma verarbeitet und sind nur für berechtigte Mitglieder Ihrer Firma sichtbar.
              </p>
            </section>

            {/* 5. Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Cookies und lokale Speicherung
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                5.1 Technisch notwendige Cookies
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Unsere Anwendung verwendet technisch notwendige Cookies, um die Funktionalität zu gewährleisten:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li><strong>Authentifizierungs-Cookies:</strong> Zur Verwaltung Ihrer Anmeldung</li>
                <li><strong>Session-Cookies:</strong> Zur Speicherung Ihrer Sitzungsdaten</li>
                <li><strong>Lokaler Speicher:</strong> Zur Speicherung von Einstellungen (z.B. Dark Mode)</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Diese Cookies sind für die Funktion der Anwendung zwingend erforderlich und können nicht deaktiviert werden.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                5.2 Rechtsgrundlage
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Funktionsfähigkeit der Anwendung).
              </p>
            </section>

            {/* 6. Drittanbieter */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Weitergabe von Daten an Dritte
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                6.1 Supabase (Datenbank und Hosting)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Wir nutzen Supabase (Supabase Inc., USA) als Datenbank- und Hosting-Anbieter. Supabase verarbeitet Ihre Daten in unserem Auftrag und ist durch einen Auftragsverarbeitungsvertrag (AVV) gebunden.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Standort der Server:</strong> EU-Region (Standard: Frankfurt, Deutschland)<br />
                <strong>Datenschutzerklärung:</strong> <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">https://supabase.com/privacy</a>
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                6.2 Vercel (Hosting)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Die Anwendung wird auf Servern von Vercel Inc. (USA) gehostet. Vercel verarbeitet nur technische Daten (z.B. IP-Adressen für Logs).
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Datenschutzerklärung:</strong> <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">https://vercel.com/legal/privacy-policy</a>
              </p>
            </section>

            {/* 7. Betroffenenrechte */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Rechte der betroffenen Person
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Sofern personenbezogene Daten von Ihnen verarbeitet werden, haben Sie folgende Rechte:
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7.1 Auskunftsrecht (Art. 15 DSGVO)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Sie haben das Recht, Auskunft über Ihre von uns verarbeiteten personenbezogenen Daten zu erhalten.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7.2 Recht auf Berichtigung (Art. 16 DSGVO)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Sie haben das Recht, unverzüglich die Berichtigung unrichtiger personenbezogener Daten zu verlangen.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7.3 Recht auf Löschung (Art. 17 DSGVO)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Sie haben das Recht, die Löschung Ihrer personenbezogenen Daten zu verlangen. Sie können Ihr Konto jederzeit in den Profileinstellungen löschen.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7.4 Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7.5 Recht auf Datenübertragbarkeit (Art. 20 DSGVO)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Sie haben das Recht, die Sie betreffenden personenbezogenen Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7.6 Widerspruchsrecht (Art. 21 DSGVO)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung Sie betreffender personenbezogener Daten Widerspruch einzulegen.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7.7 Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Sie haben das Recht, Ihre Einwilligung jederzeit zu widerrufen. Durch den Widerruf wird die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung nicht berührt.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7.8 Beschwerderecht (Art. 77 DSGVO)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten rechtswidrig erfolgt.
              </p>
            </section>

            {/* 8. Datensicherheit */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Datensicherheit
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten gegen zufällige oder vorsätzliche Manipulationen, Verlust, Zerstörung oder gegen den Zugriff unberechtigter Personen zu schützen:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>SSL/TLS-Verschlüsselung für alle Datenübertragungen</li>
                <li>Verschlüsselte Passwort-Speicherung (bcrypt)</li>
                <li>Zugriffskontrolle durch Row Level Security (RLS)</li>
                <li>Regelmäßige Sicherheitsaudits</li>
                <li>Backup-Systeme</li>
                <li>Rollenbasierte Zugriffsrechte</li>
              </ul>
            </section>

            {/* 9. Aktualität */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Aktualität und Änderung dieser Datenschutzerklärung
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Diese Datenschutzerklärung ist aktuell gültig und hat den Stand: Januar 2026.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Durch die Weiterentwicklung unserer Anwendung oder aufgrund geänderter gesetzlicher bzw. behördlicher Vorgaben kann es notwendig werden, diese Datenschutzerklärung zu ändern. Die jeweils aktuelle Datenschutzerklärung kann jederzeit auf dieser Seite von Ihnen abgerufen werden.
              </p>
            </section>
          </div>

          {/* Zurück Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Zurück zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
