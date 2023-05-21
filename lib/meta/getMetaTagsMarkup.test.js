import getMetaTagsMarkup from './getMetaTagsMarkup.js'

describe('getMetaTagsMarkup', () => {
	it(`should generate meta tags markup`, () =>
	{
		getMetaTagsMarkup
		({
			charset      : 'utf-8',
			title        : 'Test',
			description  : 'Testing metadata',
			locale       : 'ru',
			locales      : ['en', 'fr'],
			viewport     : 'width=device-width, initial-scale=1',
			keywords     : 'react, redux, webpack',
			author       : '@catamphetamine'
		})
		.should.deep.equal
		([
			"<meta charset=\"utf-8\"/>",
			"<title>Test</title>",
			"<meta property=\"og:title\" content=\"Test\"/>",
			"<meta name=\"description\" content=\"Testing metadata\"/>",
			"<meta property=\"og:description\" content=\"Testing metadata\"/>",
			"<meta property=\"og:locale\" content=\"ru\"/>",
			"<meta property=\"og:locale:alternate\" content=\"en\"/>",
			"<meta property=\"og:locale:alternate\" content=\"fr\"/>",
			"<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>",
			"<meta name=\"keywords\" content=\"react, redux, webpack\"/>",
			"<meta name=\"author\" content=\"@catamphetamine\"/>"
		])
	})

	it(`should generate meta tags markup with default title and charset`, () =>
	{
		getMetaTagsMarkup({}).should.deep.equal
		([
			"<meta charset=\"utf-8\"/>",
			"<title></title>"
		])
	})
})