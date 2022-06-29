import urlBelongsToDomain from './urlBelongsToDomain.js'

describe('urlBelongsToDomain', function() {
	it('should tell if a URL belongs to a domain', function() {
		urlBelongsToDomain('https://maps.yandex.ru/path?a=b', 'maps.yandex.ru').should.equal(true)
		urlBelongsToDomain('https://maps.yandex.ru/path?a=b', 'yandex.ru').should.equal(true)
		urlBelongsToDomain('https://maps.yandex.ru/path?a=b', 'ru').should.equal(true)
		urlBelongsToDomain('https://maps.yandex.ru/path?a=b', 'yandex.com').should.equal(false)
		urlBelongsToDomain('https://maps.yandex.ru/path?a=b', 'yandex').should.equal(false)
	})
})