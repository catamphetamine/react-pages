// 1. Run the website locally in production mode
// 2. Run this script passing the `PORT` environment variable
// 3. See the output folder (`../static` by default) for the statically generated website snapshot
// 4. Copy webpack-built assets to the output folder too
// 5. Host the output folder in the cloud at virtually no cost

import path from 'path'
import fs from 'fs-extra'
import http from 'http'

const pages = [
  '',
  '/blog',
  '/about'
]

const outputPath = path.join(__dirname, '../static')

async function main() {
  fs.removeSync(outputPath)
  for (const page of pages) {
    console.log(` * ${page || '/'}`)
    const pageContents = await downloadFile(`http://localhost:${process.env.PORT}${page}`)
    fs.outputFileSync(path.join(outputPath, page, '/index.html'), pageContents)
  }
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, (response) => {
      response.setEncoding('utf8')

      let responseBody = ''
      response.on('data', chunk => responseBody += chunk)
      response.on('end', () => resolve(responseBody))
    })

    request.on('error', reject)
    request.end()
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
