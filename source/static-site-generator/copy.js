import fs from 'fs-extra'

// Copies a file or a folder
export default function copy(from, to)
{
	return new Promise((resolve, reject) =>
	{
		fs.copy(from, to, (error) =>
		{
			if (error)
			{
				return reject(error)
			}

			resolve()
		})
	})
}