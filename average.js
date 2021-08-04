#! /usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Load the benchmark files.
 * @param {string} directory The directory to search
 * @param {string} baseName The base file name to read
 * @returns {Promise<object>} The parsed JSON benchmark files
 */
async function loadFiles(directory, baseName) {
    const files = await fs.readdir(directory)
    const loaded = await Promise.all(files.map(async file => {
        if (!file.startsWith(baseName))
            return null;

        const contents = await fs.readFile(path.join(directory, file));
        const text = contents.toString();
        const data = JSON.parse(text);

        return data;
    }));

    return loaded.filter(file => file != null);
}

/**
 * 
 * @param {object[]} benchmarks 
 */
function calculateAverage(benchmarks, audit = null) {
    const source = {};
    const count = benchmarks.length;

    const total = benchmarks
        .map(benchmark => {
            if (audit == null) {
                return benchmark.categories.performance.score;
            } else {
                return benchmark.audits[audit].numericValue ?? benchmark.audits[audit].score;
            }
        })
        .reduce((lhs, rhs) => lhs + rhs);

    return total / count;
}

const argv = process.argv.slice(2);
let [baseDirectory, baseName] = argv;
let hasUsageError = false;

if (baseDirectory == null) {
    console.error('No directory provided!');
    hasUsageError = true;
}

if (baseName == null) {
    console.error('No file pattern provided!');
    hasUsageError = true;
}

if (hasUsageError) {
    console.error('Usage: ./average.js <path> <file pattern>');
    process.exit(1);
}

const files = await loadFiles(baseDirectory, baseName);
const averageScore = calculateAverage(files);
const fcp = calculateAverage(files, 'first-contentful-paint');
const lcp = calculateAverage(files, 'largest-contentful-paint');
const cls = calculateAverage(files, 'cumulative-layout-shift');
const tbt = calculateAverage(files, 'total-blocking-time');
const tti = calculateAverage(files, 'interactive');
const si = calculateAverage(files, 'speed-index');

console.log(`The average score across ${files.length} run(s) was ${(averageScore * 100) | 0}`);
console.log(`FCP: ${fcp | 0}ms`);
console.log(`LCP: ${lcp | 0}ms`);
console.log(`CLS: ${cls}`);
console.log(`TBT: ${tbt | 0}ms`);
console.log(`TTI: ${tti | 0}ms`);
console.log(`SI: ${si | 0}ms`);