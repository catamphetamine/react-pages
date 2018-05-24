import ProgressBar from 'progress'

// const green = '\u001b[42m \u001b[0m'

export default async function upload_website(filesPath, upload)
{
	let progressBar

	await upload(filesPath,
	{
		started(total)
		{
			progressBar = new ProgressBar('  Uploading [:bar] :percent :etas',
			{
				// complete : green,
				complete   : '=',
				incomplete : ' ',
				width      : 50,
				total      : 100
			})
		},
		progress(value)
		{
			progressBar.update(value)
		}
	})
}