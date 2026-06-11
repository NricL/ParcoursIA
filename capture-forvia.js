const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    locale: 'en-US',
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0',
  });
  const page = await ctx.newPage();
  await page.goto('https://www.forvia.com/en', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);
  // Dismiss cookies
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const m = btns.find(b => /accept all|accept|got it|ok/i.test((b.textContent || '').trim()));
      if (m) m.click();
    });
  } catch(e) {}
  await page.waitForTimeout(1500);

  // Look for all images and SVGs in header, find largest in top region
  const found = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('header img, header svg, a[href="/"] img, a[href="/"] svg, .logo, .header-logo, [class*="logo"]').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top > 200 || r.width < 30 || r.width > 400) return;
      out.push({ tag: el.tagName, x: r.x, y: r.y, w: r.width, h: r.height, src: el.tagName === 'IMG' ? (el.src || el.getAttribute('src')) : null, html: el.outerHTML.substring(0, 200) });
    });
    return out;
  });
  console.log('Candidates:', JSON.stringify(found, null, 2));

  // If we found an img with SVG src, download it
  const svgImg = found.find(f => f.src && f.src.endsWith('.svg'));
  if (svgImg) {
    const r = await ctx.request.get(svgImg.src);
    if (r.ok()) {
      fs.writeFileSync(path.join(__dirname, 'assets', 'logos', 'forvia.svg'), await r.body());
      console.log('Forvia SVG saved');
    }
  } else {
    // Find largest img near top
    const imgCands = found.filter(f => f.src && f.tag === 'IMG');
    if (imgCands.length) {
      const best = imgCands.sort((a,b)=>b.w-a.w)[0];
      const r = await ctx.request.get(best.src);
      if (r.ok()) {
        const ext = best.src.match(/\.(png|webp|jpe?g|svg)$/i)?.[0] || '.png';
        fs.writeFileSync(path.join(__dirname, 'assets', 'logos', 'forvia' + ext), await r.body());
        console.log('Forvia image saved:', ext);
      }
    } else {
      // Last resort: screenshot the header
      await page.screenshot({ path: path.join(__dirname, 'assets', 'logos', 'forvia-header.png'), clip: { x: 0, y: 0, width: 500, height: 120 } });
      console.log('Forvia header screenshot saved');
    }
  }
  await browser.close();
})();
