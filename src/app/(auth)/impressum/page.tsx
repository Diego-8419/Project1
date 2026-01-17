'use client'

/**
 * Impressum
 * Anbieterkennzeichnung gemäß § 5 TMG
 */

import Link from 'next/link'

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Impressum
          </h1>

          <div className="space-y-8">
            {/* Angaben gemäß § 5 TMG */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Angaben gemäß § 5 TMG
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  <strong className="block text-lg mb-2">[Moritz Dickmann]</strong>
                  [Kleinunternehmer gemäß § 19 UStG]<br />
                  [Hengsteyer Straße 103]<br />
                  [58099 Hagen]<br />
                  [Deutschland]
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  <strong>Registereintrag:</strong><br />
                  [Handelsregister/Vereinsregister/etc.]<br />
                  Registergericht: [Ort]<br />
                  Registernummer: [Nummer]
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Umsatzsteuer-ID:</strong><br />
                  Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
                  [USt-IdNr.]
                </p>
              </div>
            </section>

            {/* Vertreten durch */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Vertreten durch
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  [Geschäftsführer/Vorstand]<br />
                  [Name des Vertretungsberechtigten]
                </p>
              </div>
            </section>

            {/* Kontakt */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Kontakt
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Telefon:</strong> [Telefonnummer]<br />
                  <strong>Telefax:</strong> [Faxnummer]<br />
                  <strong>E-Mail:</strong> <a href="mailto:[E-Mail-Adresse]" className="text-blue-600 dark:text-blue-400 hover:underline">[E-Mail-Adresse]</a>
                </p>
              </div>
            </section>

            {/* Aufsichtsbehörde (falls zutreffend) */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Aufsichtsbehörde
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  [Name der Aufsichtsbehörde]<br />
                  [Straße und Hausnummer]<br />
                  [PLZ und Ort]<br />
                  <br />
                  <strong>Website:</strong> <a href="[URL]" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">[URL]</a>
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                * Falls Ihre Tätigkeit einer behördlichen Zulassung bedarf
              </p>
            </section>

            {/* Verantwortlich für den Inhalt */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  [Name]<br />
                  [Straße und Hausnummer]<br />
                  [PLZ und Ort]
                </p>
              </div>
            </section>

            {/* EU-Streitschlichtung */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                EU-Streitschlichtung
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
            </section>

            {/* Verbraucherstreitbeilegung */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Verbraucherstreitbeilegung / Universalschlichtungsstelle
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                * Passen Sie dies an, falls Sie an einem Schlichtungsverfahren teilnehmen möchten
              </p>
            </section>

            {/* Haftungsausschluss */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Haftungsausschluss
              </h2>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Haftung für Inhalte
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Haftung für Links
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Urheberrecht
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
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
