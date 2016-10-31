// https://codeascraft.com/2011/02/15/measure-anything-measure-everything/
import StatsD from 'lynx'

export default function(settings)
{
	let statsd

	if (settings.statsd)
	{
		statsd = new StatsD(settings.statsd.host, settings.statsd.port,
		{
			on_error : monitoring.error,
			scope    : settings.statsd.prefix
		})
	}

	const monitoring =
	{
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

			try
			{
				const result = action()
				if (typeof result.then === 'function')
				{
					return result.then(finished, (error) =>
					{
						finished()
						return Promise.reject(error)
					})
				}
				return result
			}
			finally
			{
				finished()
			}
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

		error: (error) =>
		{
			if (settings.log)
			{
				return log.error(error)
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

	return monitoring

	// const finished = monitoring.started('cache')
	// ...
	// finished()
}