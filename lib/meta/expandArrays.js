// There can be arrays of properties.
// For example:
// <meta property="og:image" content="//example.com/image.jpg" />
// <meta property="og:image:width" content="100" />
// <meta property="og:image:height" content="100" />
// <meta property="og:image" content="//example.com/image@2x.jpg" />
// <meta property="og:image:width" content="200" />
// <meta property="og:image:height" content="200" />
export default function expandArrays(meta) {
	if (Array.isArray(meta[1])) {
		return meta[1].map(value => [meta[0], value])
	}
	return [meta]
}