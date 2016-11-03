// https://codeascraft.com/2011/02/15/measure-anything-measure-everything/
import StatsD from 'lynx'

export default function(settings = {})
{
	let statsd

	const monitoring =
	{
		report: (stats) =>
		{
			if (!settings.report)
			{
				return
			}

			if (settings.threshold)
			{
				if (stats.time < settings.threshold)
				{
					return
				}
			}

			return settings.report(stats)
		},

		increment: (name) =>
		{
			if (!statsd)
			{
				return
			}

			statsd.increment(name)
		},

		measure: (name, action) =>
		{
			const finished = monitoring.started(name)

			let result

			try
			{
				result = action()
			}
			catch (error)
			{
				finished()
				throw error()
			}

			if (typeof result.then === 'function')
			{
				// No `.finally()` on `Promise`
				return result.then(finished, (error) =>
				{
					finished()
					return Promise.reject(error)
				})
			}

			finished()
			return result
		},

		started: (name) =>
		{
			if (!statsd)
			{
				return () => {}
			}

			const timer = statsd.createTimer(name)
			return () => timer.stop()
		},

		time: (name, value) =>
		{
			if (!statsd)
			{
				return
			}

			statsd.timing(name, value)
		},

		error: (error) =>
		{
			if (settings.log)
			{
				return settings.log.error(error)
			}

			console.error(error)
		},

		close: () =>
		{
			if (!statsd)
			{
				return
			}

			statsd.close()
		}
	}

	if (settings.statsd)
	{
		statsd = new StatsD(settings.statsd.host, settings.statsd.port,
		{
			on_error : monitoring.error,
			scope    : settings.statsd.prefix
		})
	}

	return monitoring

	// const finished = monitoring.started('cache')
	// ...
	// finished()
}