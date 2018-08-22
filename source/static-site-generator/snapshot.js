import path from 'path'
import fs from 'fs-extra'
import ProgressBar from 'progress'

import download from './download'

// Snapshots all pages (URLs).
export default async function snapshot_website({ host, port, pages, outputPath })
{
	// Could be `null`, not just `undefined`.
	if (!pages) {
		pages = []
	}

	// Add the "base" page which is an empty page
	// which will be rendered in user's browser on client side.
	// This should be the "fallback" page.
	pages.unshift('/react-website-base')

	// The progress meter for the website snapshotting process.
	const snapshot_progress = new ProgressBar(' Snapshotting [:bar] :total :percent :etas',
	{
		complete   : '=',
		incomplete : ' ',
		width      : 50,
		total      : pages.length
	})

	// Start the website snapshotting process
	await snapshot
	(
		host,
		port,
		pages,
		outputPath,
		() => snapshot_progress.tick()
	)

	// Move `./react-website-base/index.html` to `./base.html`.
	fs.moveSync(path.join(outputPath, 'react-website-base/index.html'), path.join(outputPath, 'base.html'))
	fs.removeSync(path.join(outputPath, 'react-website-base'))
}

async function snapshot(host, port, pages, outputPath, tick)
{
	// Clear the output folder
	await remove(outputPath)

	// Snapshot every page and put it into the output folder
	for (const page of pages)
	{
		let url = page
		let targetStatusCode = 200

		if (typeof page !== 'string' && page.status)
		{
			url = page.url
			targetStatusCode = page.status
		}

		const _url = `http://${host}:${port}${url}`
		const { status, content } = await download(_url)

		if (status !== targetStatusCode)
		{
			throw new Error(`Expected ${targetStatusCode} HTTP status code for "${_url}". Got ${status}.`);
		}

		fs.outputFileSync(path.join(outputPath, url, '/index.html'), content)
		tick()
	}
}

function remove(path)
{
	return new Promise((resolve, reject) => fs.remove(path, error => error ? reject(error) : resolve()))
}