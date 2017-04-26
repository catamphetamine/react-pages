import progress from 'progress'

export default async function upload_website(output, upload)
{
	let upload_progress

	await upload(output,
	{
		started(total)
		{
			upload_progress = new progress('  Uploading [:bar] :percent :etas',
			{
				width: 50,
				total
			})
		},
		progress(value)
		{
			upload_progress.update(value)
		}
	})
}