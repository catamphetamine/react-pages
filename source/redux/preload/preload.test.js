import
{
	PRELOAD_METHOD_NAME,
	collectPreloadersFromComponents,
}
from './preload'

describe(`load`, function()
{
	it(`should collect preloaders from React Components`, () =>
	{
		const preload_1 = () => {}
		const preload_2 = () => {}
		const preload_3 = () => {}

		collectPreloadersFromComponents
		([
			null,
			{
				[PRELOAD_METHOD_NAME]: [{
					load: preload_1,
					client: true
				}]
			},
			undefined,
			{
				[PRELOAD_METHOD_NAME]: [{
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
				preload : preload_1,
				options : { client : true }
			}],
			[{
				preload : preload_2,
				options : { blocking: false }
			},
			{
				preload : preload_3,
				options : { server: true }
			}]
		])
	})
})