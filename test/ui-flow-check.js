// ウィザードUIの実フロー確認（puppeteer-core + ローカルChrome）
// test-source.pdf / test-textbook.pdf を使い、intro→...→result まで実際にクリックして進める。
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = process.argv[2] || '.';
const URL = process.argv[3] || 'http://localhost:8791/index.html';

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, name) });
  console.log('shot:', name);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 390, height: 844 },
  });
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('[console]', msg.text()));
  page.on('pageerror', (err) => console.log('[pageerror]', err.message));

  await page.goto(URL, { waitUntil: 'networkidle0' });
  await shot(page, '01-intro.png');

  await page.click('#btn-primary');
  await new Promise((r) => setTimeout(r, 200));
  await shot(page, '02-source.png');

  const sourceInput = await page.$('#file-source');
  await sourceInput.uploadFile(path.join(__dirname, 'test-source.pdf'));
  await new Promise((r) => setTimeout(r, 800));
  await shot(page, '03-source-selected.png');

  await page.click('#btn-primary');
  await new Promise((r) => setTimeout(r, 200));
  await shot(page, '04-textbook.png');

  const textbookInput = await page.$('#file-textbook');
  await textbookInput.uploadFile(path.join(__dirname, 'test-textbook.pdf'));
  await new Promise((r) => setTimeout(r, 800));
  await shot(page, '05-textbook-selected.png');

  await page.click('#btn-primary');
  // extract busy → terms へ自動遷移するまで待つ
  await page.waitForSelector('#screen-terms:not(.hidden)', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 300));
  await shot(page, '06-terms.png');

  const termsHtml = await page.$eval('#term-list', (el) => el.innerText);
  console.log('--- terms screen content ---');
  console.log(termsHtml);

  // 1つ用語を除外してみる
  const firstTermBtn = await page.$('.term-row');
  if (firstTermBtn) {
    await firstTermBtn.click();
    await new Promise((r) => setTimeout(r, 200));
    await shot(page, '06b-terms-excluded.png');
  }

  await page.click('#btn-primary');
  await new Promise((r) => setTimeout(r, 200));
  await shot(page, '07-tiers.png');

  await page.click('#btn-primary');
  await page.waitForSelector('#screen-result:not(.hidden)', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 300));
  await shot(page, '08-result.png');

  const resultText = await page.$eval('.result-hero', (el) => el.innerText);
  console.log('--- result hero content ---');
  console.log(resultText);

  await page.click('#btn-primary');
  await new Promise((r) => setTimeout(r, 200));
  await shot(page, '09-save-sheet.png');
  const sheetText = await page.$eval('#sheet-items', (el) => el.innerText);
  console.log('--- save sheet content ---');
  console.log(sheetText);

  await browser.close();
  console.log('DONE');
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
