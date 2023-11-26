import path from 'path'
import fs from 'fs-extra'
import ProgressBar from 'progress'

import download from './download.js'

// Snapshots all pages (URLs).
export default async function snapshotWebsite(options) {
	return snapshot({
		...options,
		transformContent: (content) => {
			if (options.transformContent) {
				content = options.transformContent(content)
			}
			if (options.reloadData) {
				content = addReloadDataFlag(content)
			}
			return content
		}
	})
}

// Snapshots all pages (URLs).
export async function snapshot({
	host,
	port,
	pages,
	outputPath,
	transformContent
}) {
	// Could be `null`, not just `undefined`.
	if (!pages) {
		pages = []
	}

	// Add the "base" page which is an empty page
	// which will be rendered in user's browser on client side.
	// This should be the "fallback" page.
	pages.unshift('/react-pages-base')

	// The progress meter for the website snapshotting process.
	const snapshotProgress = new ProgressBar(' Snapshotting [:bar] :total :percent :etas', {
		complete: '=',
		incomplete: ' ',
		width: 50,
		total: pages.length
	})

	// Start the website snapshotting process
	await snapshotPages(
		host,
		port,
		pages,
		outputPath,
		transformContent,
		() => snapshotProgress.tick()
	)

	// Move `./react-pages-base/index.html` to `./base.html`.
	fs.moveSync(path.join(outputPath, 'react-pages-base/index.html'), path.join(outputPath, 'base.html'))
	fs.removeSync(path.join(outputPath, 'react-pages-base'))
}

async function snapshotPages(host, port, pages, outputPath, transformContent, tick) {
	// Clear the output folder
	await fs.remove(outputPath)
	// Snapshot every page and put it into the output folder
	for (const page of pages) {
		await snapshotPage(host, port, page, outputPath, transformContent)
		tick()
	}
}

async function snapshotPage(host, port, page, outputPath, transformContent) {
		let url = page
		let targetStatusCode = 200

		if (typeof page !== 'string' && page.status) {
			url = page.url
			targetStatusCode = page.status
		}

		const _url = `http://${host}:${port}${url}`
		const { status, content } = await download(_url)

		if (status !== targetStatusCode) {
			throw new Error(`Expected ${targetStatusCode} HTTP status code for "${_url}". Got ${status}.`);
		}

		fs.outputFileSync(path.join(outputPath, url, '/index.html'), transformContent ? transformContent(content) : content)
}

function addReloadDataFlag(content) {
	const headEndsAt = content.indexOf('</head>')
	if (headEndsAt < 0) {
		throw new Error('</head> not found')
	}
	return content.slice(0, headEndsAt) +
		'<script> window._ReactPages_InitialPage_ReloadDataOnClientRender = true </script>' +
		content.slice(headEndsAt)
}