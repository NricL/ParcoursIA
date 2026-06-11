const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const src = path.join(__dirname, 'assets', 'screenshots', 'avouslia.png');
const dst = path.join(__dirname, 'assets', 'screenshots', 'avouslia.webp');

(async () => {
  const meta = await sharp(src).metadata();
  console.log('Source:', meta.width, 'x', meta.height);

  // Extract just the chat panel area, with a small padding of navy bg around
  // Chat container from screenshot: roughly x=25-1190, y=70-815 (full visible chat with input bar)
  const chatBuf = await sharp(src)
    .extract({ left: 0, top: 0, width: 1230, height: 822 })
    .toBuffer();

  // Resize to 16:9 with chat content centered + add navy padding/background
  const W = 1600, H = 900;
  const navySvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g" cx="50%" cy="40%" r="80%">
        <stop offset="0%" stop-color="#15294d"/>
        <stop offset="100%" stop-color="#0a1828"/>
      </radialGradient>
      <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.05)"/>
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect width="${W}" height="${H}" fill="url(#dots)"/>
  </svg>`;

  // Scale chat to fit within canvas with some padding (use height = 820 for the chat)
  const chatTargetH = 820;
  const chatTargetW = Math.round(1230 * (chatTargetH / 822));
  const chatResized = await sharp(chatBuf)
    .resize(chatTargetW, chatTargetH, { fit: 'fill' })
    .toBuffer();

  // Center the chat in the canvas
  const leftPad = Math.round((W - chatTargetW) / 2);
  const topPad = Math.round((H - chatTargetH) / 2);

  await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 13, g: 31, b: 60, alpha: 1 } }
  })
  .composite([
    { input: Buffer.from(navySvg), top: 0, left: 0 },
    { input: chatResized, top: topPad, left: leftPad },
  ])
  .webp({ quality: 88 })
  .toFile(dst);

  console.log('Saved:', dst, '·', (fs.statSync(dst).size/1024).toFixed(0), 'KB');
})();
