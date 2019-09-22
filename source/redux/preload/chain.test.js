import
{
	filter_preloaders,
	chain_preloaders
}
from './chain'

describe(`load`, function()
{
	it(`should filter preloaders`, () =>
	{
		const preload_1 = () => {}
		const preload_2 = () => {}
		const preload_3 = () => {}

		const preloaders =
		[
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
		]

		// server : true
		filter_preloaders(preloaders, true).should.deep.equal
		([
			[{
				preload : preload_2,
				options : { blocking: false }
			},
			{
				preload : preload_3,
				options : { server: true }
			}]
		])

		// server : false
		// initial_client_side_preload : false
		filter_preloaders(preloaders, false, false).should.deep.equal
		([
			[{
				preload : preload_1,
				options : { client : true }
			}],
			[{
				preload : preload_2,
				options : { blocking: false }
			}]
		])

		// server : false
		// initial_client_side_preload : true
		filter_preloaders(preloaders, false, true).should.deep.equal
		([
			[{
				preload : preload_1,
				options : { client : true }
			}]
		])
	})

	it(`should chain preloaders`, () =>
	{
		const preload_1 = () => {}
		const preload_2 = () => {}
		const preload_3 = () => {}
		const preload_4 = () => {}
		const preload_5 = () => {}
		const preload_6 = () => {}

		chain_preloaders
		([
			[{
				preload : preload_1,
				options : { blocking: true }
			},
			{
				preload : preload_2,
				options : {}
			}],
			[{
				preload : preload_3,
				options : { blocking: false }
			},
			{
				preload : preload_4,
				options : {}
			}]
		])
		.should.deep.equal
		([
			{
				parallel:
				[
					preload_1,
					preload_2
				]
			},
			{
				parallel:
				[
					preload_3,
					preload_4
				]
			}
		])

		chain_preloaders
		([
			[{
				preload : preload_1,
				options : {}
			},
			{
				preload : preload_2,
				options : {}
			}],
			[{
				preload : preload_3,
				options : {}
			},
			{
				preload : preload_4,
				options : { blocking: true }
			}],
			[{
				preload : preload_5,
				options : {}
			},
			{
				preload : preload_6,
				options : {}
			}]
		])
		.should.deep.equal
		([
			{
				parallel:
				[
					{
						parallel:
						[
							preload_1,
							preload_2
						]
					},
					{
						parallel:
						[
							preload_3,
							preload_4
						]
					}
				]
			},
			{
				parallel:
				[
					preload_5,
					preload_6
				]
			}
		])

		chain_preloaders
		([
			[{
				preload : preload_1,
				options : {}
			}],
			[{
				preload : preload_3,
				options : {}
			},
			{
				preload : preload_4,
				options : {}
			}],
			[{
				preload : preload_5,
				options : {}
			}]
		])
		.should.deep.equal
		([
			{
				parallel:
				[
					preload_1,
					{
						parallel:
						[
							preload_3,
							preload_4
						]
					},
					preload_5
				]
			}
		])

		chain_preloaders
		([
			[{
				preload : preload_1,
				options : {}
			}],
			[{
				preload : preload_3,
				options : {}
			}],
			[{
				preload : preload_5,
				options : {}
			}]
		])
		.should.deep.equal
		([
			{
				parallel:
				[
					preload_1,
					preload_3,
					preload_5
				]
			}
		])

		chain_preloaders
		([
			[{
				preload : preload_1,
				options : {}
			}],
			[{
				preload : preload_3,
				options : { blocking: true }
			}],
			[{
				preload : preload_5,
				options : {}
			}]
		])
		.should.deep.equal
		([
			{
				parallel:
				[
					preload_1,
					preload_3
				]
			},
			preload_5
		])

		chain_preloaders
		([
			[{
				preload : preload_1,
				options : {}
			}],
			[{
				preload : preload_3,
				options : { blockingSibling: true }
			},
			{
				preload : preload_4,
				options : {}
			}],
			[{
				preload : preload_5,
				options : { blocking: true }
			}]
		])
		.should.deep.equal
		([
			{
				parallel:
				[
					preload_1,
					[
						preload_3,
						preload_4
					],
					preload_5
				]
			}
		])

		chain_preloaders
		([
			[{
				preload : preload_1,
				options : {}
			}],
			[{
				preload : preload_3,
				options : { blockingSibling: true }
			},
			{
				preload : preload_4,
				options : { blockingSibling: true }
			},
			{
				preload : preload_5,
				options : {}
			}],
			[{
				preload : preload_6,
				options : { blocking: true }
			}]
		])
		.should.deep.equal
		([
			{
				parallel:
				[
					preload_1,
					[
						preload_3,
						preload_4,
						preload_5
					],
					preload_6
				]
			}
		])

		chain_preloaders
		([
			[{
				preload : preload_1,
				options : { blocking: true }
			}],
			[{
				preload : preload_3,
				options : { blockingSibling: true }
			},
			{
				preload : preload_4,
				options : { blockingSibling: true }
			},
			{
				preload : preload_5,
				options : { blocking: true }
			}],
			[{
				preload : preload_6,
				options : {}
			}]
		])
		.should.deep.equal
		([
			preload_1,
			[
				preload_3,
				preload_4,
				preload_5
			],
			preload_6
		])

		chain_preloaders
		([
			[{
				preload : preload_1,
				options : {}
			}],
			[{
				preload : preload_3,
				options : { blockingSibling: true }
			},
			{
				preload : preload_4,
				options : {}
			},
			{
				preload : preload_5,
				options : {}
			}],
			[{
				preload : preload_6,
				options : {}
			}]
		])
		.should.deep.equal
		([
			{
				parallel:
				[
					preload_1,
					[
						preload_3,
						{
							parallel:
							[
								preload_4,
								preload_5
							]
						}
					],
					preload_6
				]
			}
		])

		chain_preloaders
		([
			[{
				preload : preload_1,
				options : {}
			}],
			[{
				preload : preload_2,
				options : {}
			},
			{
				preload : preload_3,
				options : { blockingSibling: true }
			},
			{
				preload : preload_4,
				options : {}
			},
			{
				preload : preload_5,
				options : {}
			}],
			[{
				preload : preload_6,
				options : { blocking: true }
			}]
		])
		.should.deep.equal
		([
			{
				parallel:
				[
					preload_1,
					[
						{
							parallel:
							[
								preload_2,
								preload_3
							]
						},
						{
							parallel:
							[
								preload_4,
								preload_5
							]
						}
					],
					preload_6
				]
			}
		])
	})
})