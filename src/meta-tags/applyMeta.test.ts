import { describe, it } from 'mocha'
import { expect } from 'chai'

import applyMeta from './applyMeta.js'

import TestDocument from './document/TestDocument.js'

describe(`meta`, () => {
	it(`should update meta`, () => {
		const document = new TestDocument([
			['charset', 'win1250'],
			['og:locale', 'de'],
			['og:locale', 'fr']
		])

		applyMeta({
			title: 'Test',
			description: 'Testing metadata',
			'og:title': 'Test 2',
			'og:description': 'Testing metadata 2',
			'og:site_name': 'Testing',
			'og:locale': 'ru',
			'og:locale:alternate': ['en', 'fr'],
			viewport: 'width=device-width, initial-scale=1',
			keywords: 'react, redux, webpack',
			author: '@catamphetamine'
		}, document)

		expect(document.getMetaTags()).to.deep.equal([
			['og:locale', 'ru'],
			['description', 'Testing metadata'],
			['og:title', 'Test 2'],
			['og:description', 'Testing metadata 2'],
			['og:site_name', 'Testing'],
			['og:locale:alternate', 'en'],
			['og:locale:alternate', 'fr'],
			['viewport', 'width=device-width, initial-scale=1'],
			['keywords', 'react, redux, webpack'],
			['author', '@catamphetamine']
		])

		expect(document.getTitle()).to.equal('Test')
	})

	it(`should update to meta that doesn't specify any charset or title`, () => {
		const document = new TestDocument()
		applyMeta({}, document)
		expect(document.getMetaTags()).to.deep.equal([])
		expect(document.getTitle()).to.equal('')
	})

	it(`should update charset`, () => {
		const document = new TestDocument([['charset', 'win1250']])
		applyMeta({ charset: 'utf-8' }, document)
		expect(document.getMetaTags()).to.deep.equal([['charset', 'utf-8']])
	})

	it(`should skip updating charset when it's same as the default value`, () => {
		const document = new TestDocument([['charset', 'utf-8']])
		applyMeta({ charset: 'utf-8' }, document)
		expect(document.getMetaTags()).to.deep.equal([['charset', 'utf-8']])
	})
})