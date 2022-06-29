import parseLocationUrl from './parseLocationUrl.js';

describe('parseLocationUrl', () => {
  it('should convert a URL to a location object (relative URL + URL query parameters)', () => {
    parseLocationUrl('/error?a=b').should.deep.equal({
      pathname: '/error',
      search: '?a=b',
      hash: ''
    });
  });

  // it('should convert a URL to a location object', () => {
  //   parseLocationUrl('https://example.com').should.deep.equal({
  //     origin: 'https://example.com',
  //     pathname: '/',
  //     search: '',
  //     hash: ''
  //   });
  // });
});
