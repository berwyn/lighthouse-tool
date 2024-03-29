#! /usr/bin/env node

import * as fs from 'fs/promises';
import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';

/** @type {chromeLauncher.Options} */
const chromeFlags = { chromeFlags: ['--headless'] };

/**
 * Runs the lighthouse test for a URL in an instance of Chrome
 * @param url {string} The url to test
 * @param [chrome] {chromeLauncher.LaunchedChrome} The browser to use
 * @return {Promise<lighthouse.RunnerResult|undefined>} The runner report
 */
async function runTest (url, chrome = null) {
  let chromeCreated = false;

  if (!chrome) {
    chrome = await chromeLauncher.launch(chromeFlags);
    chromeCreated = true;
  }

  const options = { logLevel: 'warning', output: 'html', port: chrome.port };
  const runnerResult = await lighthouse(url, options);

  if (chromeCreated) {
    await chrome.kill();
  }

  return runnerResult.lhr;
}

/**
 * Runs the specified number of lighthouse tests
 * @param url {string} The website to test
 * @param [numIterations] {number} The number of iterations to run
 */
async function * generateReports (url, numIterations = 1) {
  const chrome = await chromeLauncher.launch(chromeFlags);

  for (let _ = 0; _ < numIterations; _++) {
    yield await runTest(url, chrome);
  }

  await chrome.kill();
}

const argv = process.argv.slice(2);
let [url, iteration, name] = argv;

url ??= process.env.LIGHTHOUSE_TOOL_URL;
iteration ??= 4;
name ??= 'lighthouse';

const warmupCount = process.env.LIGHTHOUSE_TOOL_WARMUP ?? 0;

if (!url) {
  console.error('No url provided!');
  console.error('Usage: lighthouse-tool <url> [iteration] [name]');
  process.exit(1);
}

const runner = async () => {
  for await (const _ of generateReports(url, warmupCount)) {
    // do nothing, we just want to warmup the environment
  }

  let index = 0;
  for await (const report of generateReports(url, iteration)) {
    await fs.writeFile(`${name}-${++index}.json`, JSON.stringify(report));
  }
};

await runner();
