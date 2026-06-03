const { chromium } = require("playwright-core")
const fs = require("node:fs")

const launchers = [
  { channel: "msedge" },
  { channel: "chrome" },
  { executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" },
  { executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" },
]

const viewports = [
  { name: "desktop", width: 1440, height: 960 },
  { name: "mobile", width: 390, height: 900 },
]

async function launchBrowser() {
  for (const config of launchers) {
    try {
      return await chromium.launch({ ...config, headless: true })
    } catch {
      continue
    }
  }
  throw new Error("No system Chromium, Chrome, or Edge browser channel was available.")
}

async function inspectCanvas(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas")
    if (!canvas) return { found: false, width: 0, height: 0, pixelSum: 0 }
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl")
    if (!gl) return { found: true, width: canvas.width, height: canvas.height, pixelSum: 0 }
    const pixels = new Uint8Array(16)
    gl.readPixels(
      Math.max(0, Math.floor(canvas.width / 2) - 1),
      Math.max(0, Math.floor(canvas.height / 2) - 1),
      2,
      2,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels,
    )
    return {
      found: true,
      width: canvas.width,
      height: canvas.height,
      pixelSum: Array.from(pixels).reduce((sum, value) => sum + value, 0),
    }
  })
}

async function main() {
  const browser = await launchBrowser()
  const results = []

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport })
      await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" })
      await page.waitForSelector("canvas", { timeout: 10000 })
      await page.waitForTimeout(1200)
      const canvas = await inspectCanvas(page)
      const canvasPath = `playwright-${viewport.name}-canvas.png`
      await page.locator("canvas").first().screenshot({ path: canvasPath })
      await page.screenshot({ path: `playwright-${viewport.name}.png`, fullPage: true })
      results.push({ viewport: viewport.name, canvas, imageBytes: fs.statSync(canvasPath).size })
      await page.close()
    }
  } finally {
    await browser.close()
  }

  for (const result of results) {
    const passed =
      result.canvas.found && result.canvas.width > 0 && result.canvas.height > 0 && result.imageBytes > 5000
    console.log(
      `${result.viewport}: canvas=${result.canvas.found} ${result.canvas.width}x${result.canvas.height} pixelSum=${result.canvas.pixelSum} screenshotBytes=${result.imageBytes} ${passed ? "PASS" : "FAIL"}`,
    )
    if (!passed) process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
