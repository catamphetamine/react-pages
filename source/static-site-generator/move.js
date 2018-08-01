import fs from 'fs-extra'

// Moves a file or a folder
export default function move(from, to)
{
	return new Promise((resolve, reject) =>
	{
		fs.move(from, to, (error) => error ? reject(error) : resolve())
	})
}