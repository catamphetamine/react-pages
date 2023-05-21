import {
	convertMeta
} from './normalizeMeta.js'

describe('normalizeMeta', () => {
	it('should convert meta', () => {
		convertMeta({
			key: [{
				_: 'rootvalue1',
				subkey1: 'subvalue1',
				subkey2: 'subvalue2',
				subkey3: {
					'subsubkey1': 'subsubvalue1',
					'subsubkey2': 'subsubvalue2'
				}
			}, {
				_: 'rootvalue2',
				subkey4: 'subvalue3',
				subkey5: 'subvalue4',
				subkey6: {
					'subsubkey3': 'subsubvalue3',
					'subsubkey4': 'subsubvalue4'
				}
			}]
		}).should.deep.equal([
			['key', 'rootvalue1'],
			['key:subkey1', 'subvalue1'],
			['key:subkey2', 'subvalue2'],
			['key:subkey3:subsubkey1', 'subsubvalue1'],
			['key:subkey3:subsubkey2', 'subsubvalue2'],
			['key', 'rootvalue2'],
			['key:subkey4', 'subvalue3'],
			['key:subkey5', 'subvalue4'],
			['key:subkey6:subsubkey3', 'subsubvalue3'],
			['key:subkey6:subsubkey4', 'subsubvalue4']
		])
	})
})