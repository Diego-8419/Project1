/**
 * PWA Icon Generator
 * Generiert alle benötigten App-Icons aus SVG
 */

const fs = require('fs').promises
const path = require('path')

// SVG als Base64-String (einfaches Türkis-Logo)
const createSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#14B8A6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0D9488;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Hintergrund -->
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}"/>

  <!-- Checkmark Icon -->
  <g transform="translate(${size * 0.25}, ${size * 0.25})">
    <path d="M ${size * 0.15} ${size * 0.25} L ${size * 0.23} ${size * 0.35} L ${size * 0.4} ${size * 0.15}"
          stroke="white"
          stroke-width="${size * 0.06}"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"/>
    <circle cx="${size * 0.25}" cy="${size * 0.25}" r="${size * 0.2}"
            stroke="white"
            stroke-width="${size * 0.04}"
            fill="none"/>
  </g>
</svg>
`

async function generateIcons() {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
  const iconsDir = path.join(__dirname, '..', 'public', 'icons')

  try {
    // Icons-Verzeichnis erstellen
    await fs.mkdir(iconsDir, { recursive: true })
    console.log('✓ Icons-Verzeichnis erstellt')

    for (const size of sizes) {
      const svg = createSVG(size)
      const filename = `icon-${size}x${size}.png`
      const filepath = path.join(iconsDir, filename)

      // SVG als PNG speichern (vereinfacht - nur SVG speichern)
      const svgFilepath = filepath.replace('.png', '.svg')
      await fs.writeFile(svgFilepath, svg)

      console.log(`✓ Generiert: ${filename.replace('.png', '.svg')}`)
    }

    console.log('\n✅ Alle Icons erfolgreich generiert!')
    console.log('\nHinweis: SVG-Dateien wurden erstellt. Für PNG-Konvertierung:')
    console.log('1. SVG-Dateien in einem Bildbearbeitungsprogramm öffnen')
    console.log('2. Als PNG exportieren')
    console.log('3. Oder online konvertieren: https://svgtopng.com/')
  } catch (error) {
    console.error('❌ Fehler beim Generieren der Icons:', error)
  }
}

generateIcons()
