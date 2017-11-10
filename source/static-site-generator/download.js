import http from 'http'
import https from 'https'

// Downloads a URL resolving to its text contents
export default function download(url)
{
	return new Promise((resolve, reject) =>
	{
		const secure = typeof url === 'string' ? url.indexOf('https://') === 0 : url.protocol === 'https:'

		const request = (secure ? https : http).request(url, (response) =>
		{
			response.setEncoding('utf8')

			let response_body = ''
			response.on('data', chunk => response_body += chunk)
			response.on('end', () => resolve({ status: response.statusCode, content: response_body }))
		})

		request.on('error', reject)
		request.end()
	})
}