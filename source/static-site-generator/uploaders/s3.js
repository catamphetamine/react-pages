import s3 from '@auth0/s3'

export default function S3Uploader({ accessKeyId, secretAccessKey, region, bucket, ACL })
{
	return function upload(directory, { started, progress })
	{
		const params =
		{
			localDir: directory,
			deleteRemoved: true, // default false, whether to remove s3 objects
			s3Params:
			{
				ACL: ACL,
				Bucket: bucket
			}
		}

		const s3Client = s3.createClient
		({
			maxAsyncS3: 20,     // this is the default
			s3RetryCount: 3,    // this is the default
			s3RetryDelay: 1000, // this is the default
			multipartUploadThreshold: 20971520, // this is the default (20 MB)
			multipartUploadSize: 15728640, // this is the default (15 MB)
			s3Options:
			{
				accessKeyId,
				secretAccessKey,
				region
			}
		})

		console.log()
		console.log('(the S3 upload progress bar seems to be buggy, just wait until it exits)')
		console.log()

		const uploader = s3Client.uploadDir(params)

		let initialized = false
		let finished = false

		uploader.on('progress', () =>
		{
			if (!initialized && uploader.progressMd5Total)
			{
				started(uploader.progressMd5Total)
				initialized = true
			}
			if (initialized)
			{
				const progressSoFar = uploader.progressMd5Amount / uploader.progressMd5Total

				// `s3` spams for a lot of `progress` with `1`.
				if (progressSoFar === 1)
				{
					if (!finished)
					{
						finished = true
						progress(1)
					}
				}
				else progress(progressSoFar)
			}
		})

		return new Promise((resolve, reject) =>
		{
			uploader.on('end', resolve)
			uploader.on('error', reject)
		})
	}
}