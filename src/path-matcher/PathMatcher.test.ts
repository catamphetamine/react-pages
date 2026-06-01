import { describe, it } from 'mocha'
import { expect } from 'chai'

import PathMatcher from './PathMatcher.js'

describe('PathMatcher', () => {
	it('should match a single handler against a given path', () => {
		const pathMatcher = new PathMatcher([
			{ path: '/1', handler: () => 1 },
			{ path: '/2', handler: () => 2 },
			{ path: '/3/:param', handler: () => 3 },
			{ path: '/4/:param1/-/:param2', handler: () => 4 }
		])

		// 1

		const result1 = pathMatcher.match('/1')
		expect(result1).to.exist
		expect(result1?.match.handler()).to.equal(1)
		expect(result1?.params).to.be.undefined

		const result10 = pathMatcher.match('/10')
		expect(result10).to.not.exist

		const result1slash = pathMatcher.match('/1/')
		expect(result1slash).to.not.exist

		// 2

		const result2 = pathMatcher.match('/2')
		expect(result2).to.exist
		expect(result2?.match.handler()).to.equal(2)
		expect(result2?.params).to.be.undefined

		const result20 = pathMatcher.match('/20')
		expect(result20).to.not.exist

		// 3

		const result3 = pathMatcher.match('/3')
		expect(result3).to.not.exist

		const result3slash = pathMatcher.match('/3/')
		expect(result3slash).to.not.exist

		const result3slash0 = pathMatcher.match('/3/0')
		expect(result3slash0).to.exist
		expect(result3slash0?.match.handler()).to.equal(3)
		expect(result3slash0?.params).to.deep.equal({ param: '0' })

		const result3slash0slash = pathMatcher.match('/3/0/')
		expect(result3slash0slash).to.not.exist

		const result3slash0a = pathMatcher.match('/3/0a')
		expect(result3slash0a).to.exist
		expect(result3slash0a?.match.handler()).to.equal(3)
		expect(result3slash0a?.params).to.deep.equal({ param: '0a' })

		const result3slash0slash0 = pathMatcher.match('/3/0/')
		expect(result3slash0slash0).to.not.exist

		// 4

		const result4 = pathMatcher.match('/4')
		expect(result4).to.not.exist

		const result4slash = pathMatcher.match('/4/')
		expect(result4slash).to.not.exist

		const result4slash0 = pathMatcher.match('/4/0')
		expect(result4slash0).to.not.exist

		const result4slash0slash = pathMatcher.match('/4/0/')
		expect(result4slash0slash).to.not.exist

		const result4slash0slashDash = pathMatcher.match('/4/0/-')
		expect(result4slash0slashDash).to.not.exist

		const result4slash0slashDashSlash = pathMatcher.match('/4/0/-/')
		expect(result4slash0slashDashSlash).to.not.exist

		const result4slash0slash0SlashAbc = pathMatcher.match('/4/0/0/abc')
		expect(result4slash0slash0SlashAbc).to.not.exist

		const result4slash0slashDashSlashAbc = pathMatcher.match('/4/0/-/abc')
		expect(result4slash0slashDashSlashAbc).to.exist
		expect(result4slash0slashDashSlashAbc?.match.handler()).to.equal(4)
		expect(result4slash0slashDashSlashAbc?.params).to.deep.equal({ param1: '0', param2: 'abc' })

		const result4slash0slashDashSlashAbcSlash = pathMatcher.match('/4/0/-/abc/')
		expect(result4slash0slashDashSlashAbcSlash).to.not.exist

		const result4slash0slashDashSlashAbcSlash0 = pathMatcher.match('/4/0/-/abc/0')
		expect(result4slash0slashDashSlashAbcSlash0).to.not.exist
	})

	it('should match all handlers against a given path', () => {
		const pathMatcher = new PathMatcher([
			{ path: '/1', handler: () => 1 },
			{ path: '/1', handler: () => 2 },
			{ path: '/3', handler: () => 3 }
		])

		const results1 = pathMatcher.matchAll('/1')
		expect(results1.length).to.equal(2)
		expect(results1[0].match.handler()).to.equal(1)
		expect(results1[0].params).to.be.undefined
		expect(results1[1].match.handler()).to.equal(2)
		expect(results1[1].params).to.be.undefined

		const results2 = pathMatcher.matchAll('/2')
		expect(results2.length).to.equal(0)

		const results3 = pathMatcher.matchAll('/3')
		expect(results3.length).to.equal(1)
		expect(results3[0].match.handler()).to.equal(3)
		expect(results3[0].params).to.be.undefined
	})
})