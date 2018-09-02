import
{
	collectPreloadersFromComponents,
}
from './preload'

import
{
	PRELOAD_METHOD_NAME,
	PRELOAD_OPTIONS_NAME
}
from './decorator'

describe(`@preload`, function()
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
				[PRELOAD_METHOD_NAME]  : [preload_1],
				[PRELOAD_OPTIONS_NAME] : [{ client : true }]
			},
			undefined,
			{
				[PRELOAD_METHOD_NAME]  : [preload_2, preload_3],
				[PRELOAD_OPTIONS_NAME] : [{ blocking: false }, { server : true }]
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