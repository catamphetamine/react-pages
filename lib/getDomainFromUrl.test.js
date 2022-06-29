import getDomainFromUrl from './getDomainFromUrl.js'

describe('getDomainFromUrl', function() {
	it('should get domain from URL', function() {
		getDomainFromUrl('https://yandex.ru/path?a=b').should.equal('yandex.ru')
		getDomainFromUrl('//yandex.ru/path?a=b').should.equal('yandex.ru')
		getDomainFromUrl('/path?a=b').should.equal('')
	})
})