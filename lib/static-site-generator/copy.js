import fs from 'fs-extra'

// Copies a file or a folder
export default function copy(from, to) {
	return fs.copy(from, to)
}