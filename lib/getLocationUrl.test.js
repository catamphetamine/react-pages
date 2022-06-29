import getLocationUrl from './getLocationUrl.js';

describe('getLocationUrl', () => {
  it('should convert a location object to a URL (/)', () => {
    getLocationUrl({
      pathname: '/',
      search: '?a=b'
    }).should.equal('/?a=b')
  })

  // it('should convert a location object to a URL (https://yandex.ru)', () => {
  //   getLocationUrl({
  //     origin: 'https://yandex.ru',
  //     pathname: '/',
  //     search: '?a=b'
  //   }).should.equal('https://yandex.ru/?a=b')
  // })
})
