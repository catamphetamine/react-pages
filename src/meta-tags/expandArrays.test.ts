import { describe, it } from 'mocha'
import { expect } from 'chai'

import expandArrays from './expandArrays.js'

describe('expandArrays', () => {
	it('should expand arrays', () => {
		expect(expandArrays(['key', 'value'])).to.deep.equal([['key', 'value']])

		expect(expandArrays(['key', [
			'subvalue1',
			'subvalue2'
		]])).to.deep.equal([
			['key', 'subvalue1'],
			['key', 'subvalue2']
		])

		expect(expandArrays(['key', [{
			'subkey1': 'subvalue1',
			'subkey2': 'subvalue2'
		}, {
			'subkey3': 'subvalue3',
			'subkey4': 'subvalue4'
		}]])).to.deep.equal([
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