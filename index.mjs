import puppeteer from "puppeteer-core";
import fs from "fs";

async function readCsv(inputFile) {
  const results = [];
  let headers = [];
  const file = await fs.readFileSync(inputFile, 'utf8');
  file.split('\n').forEach((line, index) => {
    // the first header is the column names
    if (index === 0) {
      headers = line.split(',');
    } else {
      const row = line.split(',');
      results.push(row);
    }
  });
  return [headers, results];
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const INPUT_FILE = "./input.csv";
  const TARGET_COLUMN_NAME = 'name';
  const LAYER_NAME = 'Ramen';

  const [headers, results] = await readCsv(INPUT_FILE);
  const targetColumnIndex = headers.indexOf(TARGET_COLUMN_NAME);

  if (targetColumnIndex === -1) {
    console.error('Target column name not found');
    return;
  }

  const browser = await puppeteer.connect({
    browserWSEndpoint: "ws://localhost:9222/devtools/browser/228b2870-6901-46b9-803b-f63a07a37177",
    defaultViewport: null,
  });

  console.log('browser connected status: ', browser.isConnected());

  const page = await browser.newPage();
  await page.goto("https://www.google.com/maps/d/edit?mid=1AOft38t42oCslo_ye0OLlTtFIYfgyLY&ll=35.20003440953889%2C137.65354794999996&z=9");

  // Find for aria-label that contains the keyword" and select the layer
  const layerSelector = `[aria-label*="${LAYER_NAME}"]`;
  await page.waitForSelector(layerSelector);
  await page.click(layerSelector);

  const failedResult = [];
  // TODO test
  for (let i = 0; i < results.length; i++) {
    const target = results[i][targetColumnIndex];
    await page.waitForSelector("#mapsprosearch-field");
    await page.type("#mapsprosearch-field", target);
    await page.click("#mapsprosearch-button");

    const button = await page.waitForSelector('#addtomap-button');
    if (!button) {
      // store failed results
      failedResult.push(target);
      continue;
    }
    await page.click('#addtomap-button');
  }
  
  // disconnect
  await browser.disconnect();
  console.log('browser connected status: ', browser.isConnected());
  console.log('failed results: ', failedResult);
})();