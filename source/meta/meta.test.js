import
{
	updateMeta,
	generateMetaTagsMarkup,
	expandObjects,
	expandArrays,
	convertMeta,
	convertOpenGraphLocaleToLanguageTag
}
from './meta'

import TestDocument from './TestDocument'

describe(`meta`, () =>
{
	it(`should update meta`, () =>
	{
		const document = new TestDocument
		([
			['charset', 'win1250'],
			['og:locale', 'de'],
			['og:locale', 'fr']
		])

		updateMeta
		({
			title        : 'Test',
			description  : 'Testing metadata',
			site_name    : 'Testing',
			locale       : 'ru',
			locales      : ['en', 'fr'],
			viewport     : 'width=device-width, initial-scale=1',
			keywords     : 'react, redux, webpack',
			author       : '@catamphetamine'
		},
		document)

		document.getMetaTags().should.deep.equal
		([
			['og:locale', 'ru'],
			['og:title', 'Test'],
			['description', 'Testing metadata'],
			['og:description', 'Testing metadata'],
			['og:site_name', 'Testing'],
			['og:locale:alternate', 'en'],
			['og:locale:alternate', 'fr'],
			['viewport', 'width=device-width, initial-scale=1'],
			['keywords', 'react, redux, webpack'],
			['author', '@catamphetamine']
		])

		document.getTitle().should.equal('Test')
	})

	it(`should transform "siteName" to "site_name"`, () =>
	{
		const document = new TestDocument
		([
			['charset', 'utf-8'],
			['og:locale', 'en'],
		])

		updateMeta({
			siteName: 'Testing'
		}, document)

		document.getMetaTags().should.deep.equal
		([
			['og:site_name', 'Testing']
		])
	})

	it(`should update meta without title and charset`, () =>
	{
		const document = new TestDocument()
		updateMeta({}, document)
		document.getMetaTags().should.deep.equal([])
		expect(document.getTitle()).to.be.undefined
	})

	it(`should update charset`, () =>
	{
		const document = new TestDocument([['charset', 'win1250']])
		updateMeta({ charset : 'utf-8' }, document)
		document.getMetaTags().should.deep.equal([['charset', 'utf-8']])
	})

	it(`should skip updating same charset`, () =>
	{
		const document = new TestDocument([['charset', 'utf-8']])
		updateMeta({ charset : 'utf-8' }, document)
		document.getMetaTags().should.deep.equal([['charset', 'utf-8']])
	})

	it(`should generate meta tags markup`, () =>
	{
		generateMetaTagsMarkup
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
		generateMetaTagsMarkup({}).should.deep.equal
		([
			"<meta charset=\"utf-8\"/>",
			"<title></title>"
		])
	})

	it('should expand objects', () => {
		expandObjects(['key', 'value']).should.deep.equal([['key', 'value']])

		expandObjects(['key', {
			subkey1: 'subvalue1',
			subkey2: 'subvalue2',
			subkey3: {
				'subsubkey1': 'subsubvalue1',
				'subsubkey2': 'subsubvalue2'
			}
		}]).should.deep.equal([
			['key:subkey1', 'subvalue1'],
			['key:subkey2', 'subvalue2'],
			['key:subkey3:subsubkey1', 'subsubvalue1'],
			['key:subkey3:subsubkey2', 'subsubvalue2']
		])
	})

	it('should expand arrays', () => {
		expandArrays(['key', 'value']).should.deep.equal([['key', 'value']])

		expandArrays(['key', [
			'subvalue1',
			'subvalue2'
		]]).should.deep.equal([
			['key', 'subvalue1'],
			['key', 'subvalue2']
		])

		expandArrays(['key', [{
			'subkey1': 'subvalue1',
			'subkey2': 'subvalue2'
		}, {
			'subkey3': 'subvalue3',
			'subkey4': 'subvalue4'
		}]]).should.deep.equal([
			['key', {
				'subkey1': 'subvalue1',
				'subkey2': 'subvalue2'
			}],
			['key', {
				'subkey3': 'subvalue3',
				'subkey4': 'subvalue4'
			}]
		])
	})

	it('should convert meta', () => {
		convertMeta({
			key: [{
				_: 'rootvalue1',
				subkey1: 'subvalue1',
				subkey2: 'subvalue2',
				subkey3: {
					'subsubkey1': 'subsubvalue1',
					'subsubkey2': 'subsubvalue2'
				}
			}, {
				_: 'rootvalue2',
				subkey4: 'subvalue3',
				subkey5: 'subvalue4',
				subkey6: {
					'subsubkey3': 'subsubvalue3',
					'subsubkey4': 'subsubvalue4'
				}
			}]
		}).should.deep.equal([
			['key', 'rootvalue1'],
			['key:subkey1', 'subvalue1'],
			['key:subkey2', 'subvalue2'],
			['key:subkey3:subsubkey1', 'subsubvalue1'],
			['key:subkey3:subsubkey2', 'subsubvalue2'],
			['key', 'rootvalue2'],
			['key:subkey4', 'subvalue3'],
			['key:subkey5', 'subvalue4'],
			['key:subkey6:subsubkey3', 'subsubvalue3'],
			['key:subkey6:subsubkey4', 'subsubvalue4']
		])
	})

	it('should convert locales', () => {
		convertOpenGraphLocaleToLanguageTag('ru_RU').should.equal('ru-RU')
		convertOpenGraphLocaleToLanguageTag('ru').should.equal('ru')
	})
})