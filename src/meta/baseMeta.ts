export default {
	charset: 'utf-8',
	// Fixes CSS screen width on mobile devices.
	// Otherwise media queries would not be applied initially
	// and it would show desktop version design.
	// Also, for `/react-pages-base` page this meta tag
	// needs to be present in markup as the default one
	// because `/react-pages-base` page doesn't collect
	// meta from page components.
	viewport: 'width=device-width, initial-scale=1.0'
}