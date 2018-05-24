import path from 'path'
import fs from 'fs-extra'
import progress from 'progress'

import download from './download'

// Snapshots all pages (URLs)
export default async function snapshot_website({ host, port, pages, outputPath })
{
	// Add the main ("home") page
	pages.unshift('')

	// The progress meter for the website snapshotting process
	const snapshot_progress = new progress(' Snapshotting [:bar] :total :percent :etas',
	{
		width: 50,
		total: pages.length
	})

	// Start the website snapshotting process
	await snapshot
	(
		host,
		port,
		pages,
		outputPath,
		function progress_tick()
		{
			snapshot_progress.tick()
		}
	)
}

async function snapshot(host, port, pages, outputPath, tick)
{
	// Clear the output folder
	fs.removeSync(outputPath)

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

		const { status, content } = await download(`http://${host}:${port}${url}`)

		if (status !== targetStatusCode)
		{
			throw new Error(`Expected ${targetStatusCode} HTTP status code for page "${url}". Got ${status}.`);
		}

		fs.outputFileSync(path.join(outputPath, url, '/index.html'), content)
		tick()
	}
}
