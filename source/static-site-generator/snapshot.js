import path from 'path'
import fs from 'fs-extra'
import progress from 'progress'

import download from './download'

// Snapshots all pages (URLs)
export default async function snapshot_website({ host, port, pages, output })
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
		output,
		function progress_tick()
		{
			snapshot_progress.tick()
		}
	)
}

async function snapshot(host, port, pages, output, tick)
{
	// Clear the output folder
	fs.removeSync(output)

	// Snapshot every page and put it into the output folder
	for (const page of pages)
	{
		const page_contents = await download(`http://${host}:${port}${page}`)
		fs.outputFileSync(path.join(output, page, '/index.html'), page_contents)
		tick()
	}
}
