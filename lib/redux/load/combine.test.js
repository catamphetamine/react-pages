import {
	filterLoaders,
	combineLoaders,
	createPromiseFromLoaders
} from './combine.js'

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
		]

		// server : true
		filterLoaders(preloaders, true).should.deep.equal
		([
			[{
				load : preload_2,
				options : { blocking: false }
			},
			{
				load : preload_3,
				options : { server: true }
			}]
		])

		// server : false
		// initial_client_side_load : false
		filterLoaders(preloaders, false, false).should.deep.equal
		([
			[{
				load : preload_1,
				options : { client : true }
			}],
			[{
				load : preload_2,
				options : { blocking: false }
			}]
		])

		// server : false
		// initial_client_side_load : true
		filterLoaders(preloaders, false, true).should.deep.equal
		([
			[{
				load : preload_1,
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

		combineLoaders
		([
			[{
				load : preload_1,
				options : { blocking: true }
			},
			{
				load : preload_2,
				options : {}
			}],
			[{
				load : preload_3,
				options : { blocking: false }
			},
			{
				load : preload_4,
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

		combineLoaders
		([
			[{
				load : preload_1,
				options : {}
			},
			{
				load : preload_2,
				options : {}
			}],
			[{
				load : preload_3,
				options : {}
			},
			{
				load : preload_4,
				options : { blocking: true }
			}],
			[{
				load : preload_5,
				options : {}
			},
			{
				load : preload_6,
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

		combineLoaders
		([
			[{
				load : preload_1,
				options : {}
			}],
			[{
				load : preload_3,
				options : {}
			},
			{
				load : preload_4,
				options : {}
			}],
			[{
				load : preload_5,
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

		combineLoaders
		([
			[{
				load : preload_1,
				options : {}
			}],
			[{
				load : preload_3,
				options : {}
			}],
			[{
				load : preload_5,
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

		combineLoaders
		([
			[{
				load : preload_1,
				options : {}
			}],
			[{
				load : preload_3,
				options : { blocking: true }
			}],
			[{
				load : preload_5,
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

		combineLoaders
		([
			[{
				load : preload_1,
				options : {}
			}],
			[{
				load : preload_3,
				options : { blockingSibling: true }
			},
			{
				load : preload_4,
				options : {}
			}],
			[{
				load : preload_5,
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

		combineLoaders
		([
			[{
				load : preload_1,
				options : {}
			}],
			[{
				load : preload_3,
				options : { blockingSibling: true }
			},
			{
				load : preload_4,
				options : { blockingSibling: true }
			},
			{
				load : preload_5,
				options : {}
			}],
			[{
				load : preload_6,
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

		combineLoaders
		([
			[{
				load : preload_1,
				options : { blocking: true }
			}],
			[{
				load : preload_3,
				options : { blockingSibling: true }
			},
			{
				load : preload_4,
				options : { blockingSibling: true }
			},
			{
				load : preload_5,
				options : { blocking: true }
			}],
			[{
				load : preload_6,
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

		combineLoaders
		([
			[{
				load : preload_1,
				options : {}
			}],
			[{
				load : preload_3,
				options : { blockingSibling: true }
			},
			{
				load : preload_4,
				options : {}
			},
			{
				load : preload_5,
				options : {}
			}],
			[{
				load : preload_6,
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

		combineLoaders
		([
			[{
				load : preload_1,
				options : {}
			}],
			[{
				load : preload_2,
				options : {}
			},
			{
				load : preload_3,
				options : { blockingSibling: true }
			},
			{
				load : preload_4,
				options : {}
			},
			{
				load : preload_5,
				options : {}
			}],
			[{
				load : preload_6,
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

	it(`should return preloader results`, async () =>
	{
		const preload_1 = () => Promise.resolve({ a: 1 })
		const preload_2 = () => Promise.resolve({ b: 2 })
		const preload_3 = () => Promise.resolve()
		const preload_4 = () => Promise.resolve()
		const preload_5 = () => Promise.resolve({ e: 5 })

		const promise = createPromiseFromLoaders([
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
			},
			preload_5
		], () => false)

		const result = await promise
		result.should.deep.equal({
			a: 1,
			b: 2,
			e: 5
		})
	})
})