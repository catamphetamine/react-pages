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
			site_name: 'Testing',
			locale: 'ru',
			locales: ['en', 'fr'],
			viewport: 'width=device-width, initial-scale=1',
			keywords: 'react, redux, webpack',
			author: '@catamphetamine'
		}, document)

		expect(document.getMetaTags()).to.deep.equal([
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
	})

	it(`should transform "siteName" to "site_name"`, () => {
		const document = new TestDocument([
			['charset', 'utf-8'],
			['og:locale', 'en'],
		])

		applyMeta({
			siteName: 'Testing'
		}, document)

		expect(document.getMetaTags()).to.deep.equal([
			['og:site_name', 'Testing']
		])
	})

	it(`should update to meta without any charset`, () => {
		const document = new TestDocument()
		applyMeta({}, document)
		expect(document.getMetaTags()).to.deep.equal([])
	})

	it(`should update charset`, () => {
		const document = new TestDocument([['charset', 'win1250']])
		applyMeta({ charset : 'utf-8' }, document)
		expect(document.getMetaTags()).to.deep.equal([['charset', 'utf-8']])
	})

	it(`should skip updating same charset`, () => {
		const document = new TestDocument([['charset', 'utf-8']])
		applyMeta({ charset : 'utf-8' }, document)
		expect(document.getMetaTags()).to.deep.equal([['charset', 'utf-8']])
	})
})