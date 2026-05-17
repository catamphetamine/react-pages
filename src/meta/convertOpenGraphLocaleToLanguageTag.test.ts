import { describe, it } from 'mocha'
import { expect } from 'chai'

import convertOpenGraphLocaleToLanguageTag from './convertOpenGraphLocaleToLanguageTag.js'

describe('convertOpenGraphLocaleToLanguageTag', () => {
	it('should convert locales', () => {
		expect(convertOpenGraphLocaleToLanguageTag('ru_RU')).to.equal('ru-RU')
		expect(convertOpenGraphLocaleToLanguageTag('ru')).to.equal('ru')
	})
})