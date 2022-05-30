import { Transform } from 'stream'

// A basic stream implementation.
// https://nodejs.org/api/stream.html#stream_implementing_a_transform_stream
export default class Stream extends Transform {
	_transform(chunk, encoding, callback) {
		this.push(chunk)
		callback()
	}
}