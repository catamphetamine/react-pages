import { expect } from 'chai'

import parse_dates from '../source/date parser'

describe('date parser', function()
{
	it('should parse dates correctly', function()
	{
		const object =
		{
			a: '2011',
			b: '2011-01-01',
			c: '2011-15-30',
			d: '2011-12-32',
			e: '2016-08-27T03',
			f: '2016-08-27T03:49',
			g: '2016-08-27T03:49:00',
			h: '2016-08-27T03:49:00.1',
			i: '2016-08-27T03:49:00.123',
			j: '2016-08-27T03:49:00,123',
			k: '2016-08-27T03:49:00+03',
			l: '2016-08-27 03:49:00+03',
			m: '2016-08-27 03:49:00+03:00',
			n: '2016-08-27 03:49:00+0300',
			o: '2016-08-27T21:12:24.506+03',
			p: '2016-08-27T21:12:24.506-03',
			q: '2016-12-13T22:56:48.417Z',
			r: '2016-12-13T22:56:48.417z'
		}

		parse_dates(object)

		expect(object.a).to.be.a('string')
		expect(object.b).to.be.an.instanceof(Date)
		expect(object.c).to.be.a('string')
		expect(object.d).to.be.a('string')
		expect(object.e).to.be.a('string')
		expect(object.f).to.be.an.instanceof(Date)
		expect(object.g).to.be.an.instanceof(Date)
		expect(object.h).to.be.an.instanceof(Date)
		expect(object.i).to.be.an.instanceof(Date)
		expect(object.j).to.be.an.instanceof(Date)
		expect(object.k).to.be.an.instanceof(Date)
		expect(object.l).to.be.an.instanceof(Date)
		expect(object.m).to.be.an.instanceof(Date)
		expect(object.n).to.be.an.instanceof(Date)
		expect(object.o).to.be.an.instanceof(Date)
		expect(object.p).to.be.an.instanceof(Date)
		expect(object.q).to.be.an.instanceof(Date)
		expect(object.r).to.be.an.instanceof(Date)
	})
})