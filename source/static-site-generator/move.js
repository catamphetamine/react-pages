import fs from 'fs-extra'

// Moves a file or a folder
export default function move(from, to) {
	return fs.move(from, to)
}