import { LOAD_METHOD_NAME, collectLoadFunctionsFromComponents } from './load.js'

describe('load', function()
{
	it(`should collect preloaders from React Components`, () =>
	{
		const preload_1 = () => {}
		const preload_2 = () => {}
		const preload_3 = () => {}

		collectLoadFunctionsFromComponents
		([
			null,
			{
				[LOAD_METHOD_NAME]: [{
					load: preload_1,
					client: true
				}]
			},
			undefined,
			{
				[LOAD_METHOD_NAME]: [{
					load: preload_2,
					blocking: false
				}, {
					load: preload_3,
					server : true
				}]
			},
			{}
		])
		.should.deep.equal
		([
			[{
				load : preload_1,
				options : { client : true }
			}],
			[{
				load : preload_2,
				options : { blocking: false }
			},
			{
				load : preload_3,
				options : { server: true }
			}]
		])
	})
})