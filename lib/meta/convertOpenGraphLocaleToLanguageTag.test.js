import convertOpenGraphLocaleToLanguageTag from './convertOpenGraphLocaleToLanguageTag.js'

describe('convertOpenGraphLocaleToLanguageTag', () => {
	it('should convert locales', () => {
		convertOpenGraphLocaleToLanguageTag('ru_RU').should.equal('ru-RU')
		convertOpenGraphLocaleToLanguageTag('ru').should.equal('ru')
	})
})