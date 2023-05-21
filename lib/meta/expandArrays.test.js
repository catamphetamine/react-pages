import expandArrays from './expandArrays.js'

describe('expandArrays', () => {
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
})