import s3 from '@auth0/s3'

export default function S3Uploader({ accessKeyId, secretAccessKey, region, bucket })
{
	return function upload(directory, { started, progress })
	{
		const params =
		{
			localDir: directory,
			deleteRemoved: true, // default false, whether to remove s3 objects
			s3Params:
			{
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

		const uploader = s3Client.uploadDir(params)

		let initialized = false

		uploader.on('progress', () =>
		{
			if (!initialized && uploader.progressMd5Total)
			{
				started(uploader.progressMd5Total)
				initialized = true
			}
			if (initialized)
			{
				progress(uploader.progressMd5Amount / uploader.progressMd5Total)
			}
		})

		return new Promise((resolve, reject) =>
		{
			uploader.on('end', resolve)
			uploader.on('error', reject)
		})
	}
}