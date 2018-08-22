import parseDates from './parseDates'

describe('parseDates', function()
{
	it('should parse dates correctly', function()
	{
		const object =
		{
			date: '2016-12-13T22:56:48.417Z',

			dates:
			[
				'2016-08-27T03:49:00Z',
				'2016-08-27T03:49:00.1Z',
				'2016-08-27T03:49:00.123Z',
				'2016-08-27T03:49:00-03',
				'2016-08-27T03:49:00+03',
				'2016-08-27T03:49:00+03:00',
				'2016-08-27T03:49:00+0300',
				'2016-08-27T21:12:24.506+03',
				'2016-08-27T21:12:24.506-03',
				'2016-12-13T22:56:48.417z'
			],

			non_dates:
			[
				'2011',
				'2011-01',
				'2011-01-01',

				// No seconds
				'2011-01-01T03:49Z',
				'2016-08-27T03:49Z',

				// Invalid month
				'2011-15-30T03:49:00Z',

				// Invalid day
				'2011-12-32T03:49:00Z',

				'2016-08-27T03',
				'2016-08-27T03Z',
				'2016-08-27T03:49',
				'2016-08-27T03:49:00',
				'2016-08-27T03:49:00.1',
				'2016-08-27T03:49:00.123',
				'2016-08-27 03:49:00+03',
				'2016-08-27 03:49:00+03:00',
				'2016-08-27 03:49:00+0300',
				'2016-08-27 21:12:24.506+03',
				'2016-08-27 21:12:24.506-03',
				'2016-12-13T22:56:48.417'
			]
		}

		parseDates(object)

		expect(object.date).to.be.an.instanceof(Date)

		for (const date of object.dates)
		{
			expect(date).to.be.an.instanceof(Date)
		}

		for (const non_date of object.non_dates)
		{
			expect(non_date).to.be.a('string')
		}
	})
})