# Lighthouse Tool
Really, I just needed to automate Lighthouse runs.

## Usage
```bash
./index.mjs https://web.dev 4 lighthouse-report
```

### Environment Variables
- `LIGHTHOUSE_TOOL_WARMUP`, integer, optional: How many runs to execute before recording results. Defaults to 0.
- `LIGHTHOUSE_TOOL_URL`, string, optional: The URL to test, as an alternative to the positional argument. 

This will generate `lighthouse-report-1.json` through `lighthouse-report-4.json` with the results of your Lighthouse runs.