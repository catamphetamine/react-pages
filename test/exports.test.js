import React from 'react'

import
{
	getState,
	getHttpClient,
	goto,
	redirect,
	PRELOAD_STARTED,
	PRELOAD_FINISHED,
	PRELOAD_FAILED,
	ReduxModule,
	underscoredToCamelCase,
	eventName,
	Link,
	getCookie,
	getPreferredLocales,
	getPreferredLocale,
	getLanguageFromLocale,
	replaceLocation,
	pushLocation,
	goBack,
	goBackTwoPages,
	goForward,
	indicateLoading,
	Loading,
	Route,
	Redirect,
	useRouter,
	useRoute,
	useLocation
}
from '../index.js'

import server, {
	render,
	renderError
} from '../server.js'

describe(`exports`, function()
{
	it(`should export ES6`, () =>
	{
		indicateLoading.should.be.a('function')
		Loading.WrappedComponent.should.be.a('function')

		getState.should.be.a('function')
		getHttpClient.should.be.a('function')

		goto.should.be.a('function')
		redirect.should.be.a('function')

		PRELOAD_STARTED.should.be.a('string')
		PRELOAD_FINISHED.should.be.a('string')
		PRELOAD_FAILED.should.be.a('string')

		underscoredToCamelCase.should.be.a('function')
		eventName.should.be.a('function')

		Link.render.should.be.a('function')
		Route.should.be.a('function')
		Redirect.should.be.a('function')
		useRoute.should.be.a('function')
		useRouter.should.be.a('function')

		getCookie.should.be.a('function')
		getPreferredLocales.should.be.a('function')
		getPreferredLocale.should.be.a('function')
		getLanguageFromLocale.should.be.a('function')

		replaceLocation.should.be.a('function')
		pushLocation.should.be.a('function')
		goBack.should.be.a('function')
		goBackTwoPages.should.be.a('function')
		goForward.should.be.a('function')

		useLocation.should.be.a('function')
	})

	it(`should export rendering service`, () =>
	{
		server.should.be.a('function')
		render.should.be.a('function')
		renderError.should.be.a('function')
	})
})