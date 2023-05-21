import expandObjects from './expandObjects.js'

describe('expandObjects', () => {
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

})