/**
 * SVG zu PNG Konverter mit Sharp
 */

const sharp = require('sharp')
const fs = require('fs').promises
const path = require('path')

async function convertToPNG() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons')
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

  try {
    for (const size of sizes) {
      const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`)
      const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`)

      const svgBuffer = await fs.readFile(svgPath)

      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(pngPath)

      console.log(`✓ Konvertiert: icon-${size}x${size}.png`)
    }

    console.log('\n✅ Alle PNG-Icons erfolgreich erstellt!')
  } catch (error) {
    console.error('❌ Fehler:', error)
  }
}

convertToPNG()
