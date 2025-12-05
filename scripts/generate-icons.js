// Icon boyutlandırma scripti
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputPath = path.join(__dirname, '../public/pwa-512x512.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
    for (const size of sizes) {
        const outputPath = path.join(outputDir, `pwa-${size}x${size}.png`);

        // Skip if it's the original 512x512
        if (size === 512) {
            console.log(`✓ pwa-512x512.png already exists`);
            continue;
        }

        await sharp(inputPath)
            .resize(size, size)
            .png()
            .toFile(outputPath);

        console.log(`✓ Generated pwa-${size}x${size}.png`);
    }

    // Generate favicon
    await sharp(inputPath)
        .resize(32, 32)
        .png()
        .toFile(path.join(outputDir, 'favicon.png'));
    console.log('✓ Generated favicon.png');

    // Generate Apple touch icon
    await sharp(inputPath)
        .resize(180, 180)
        .png()
        .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('✓ Generated apple-touch-icon.png');

    console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
