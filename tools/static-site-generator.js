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
