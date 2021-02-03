#! /usr/bin/env node

import * as fs from 'fs'
import { promisify } from 'util'
import lighthouse from 'lighthouse'
import chromeLauncher from 'chrome-launcher'

const writeFileAsync = promisify(fs.writeFile)

/**
 * Runs the lighthouse test for a URL in an instance of Chrome
 * @param url {string} The url to test
 * @param [chrome] {chromeLauncher.LaunchedChrome} The browser to use
 * @return {Promise<lighthouse.RunnerResult|undefined>} The runner report
 */
async function runTest (url, chrome = null) {
  let chromeCreated = false
  if (!chrome) {
    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] })
    chromeCreated = true
  }

  const options = { logLevel: 'warning', output: 'html', port: chrome.port }
  const runnerResult = await lighthouse(url, options)

  if (chromeCreated) {
    await chrome.kill()
  }

  return runnerResult.lhr
}

/**
 * Runs the specified number of lighthouse tests
 * @param url {string} The website to test
 * @param [numIterations] {number} The number of iterations to run
 */
async function * generateReports (url, numIterations = 1) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] })

  for (let _ = 0; _ < numIterations; _++) {
    yield await runTest(url, chrome)
  }

  await chrome.kill()
}

const argv = process.argv.slice(2)
let [url, iteration, name] = argv

url ??= process.env.LIGHTHOUSE_TOOL_URL
iteration ??= 4
name ??= 'lighthouse'

if (!url) {
  console.error('No url provided!')
  console.error('Usage: lighthouse-tool <url> [iteration] [name]')
  process.exit(1)
}

const runner = async () => {
  let index = 0
  for await (const report of generateReports(url, iteration)) {
    await writeFileAsync(`${name}-${++index}.json`, JSON.stringify(report))
  }
}

await runner()
