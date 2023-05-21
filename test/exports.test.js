import Library from '../index.cjs'
import Server from '../server.cjs'

import {
	getState,
	getHttpClient,
	goto,
	redirect,
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
	Route,
	Redirect,
	useRoute,
	useRouter,
	useNavigationStartEffect,
	useNavigationEndEffect,
	useLocation,
	useLoading,
	updateReducers
	// updateMeta
} from '../index.js'

import server, {
	render,
	renderError
} from '../server.js'

describe(`exports`, function() {
	it(`should export ES6`, () => {
		getState.should.be.a('function')
		getHttpClient.should.be.a('function')

		goto.should.be.a('function')
		redirect.should.be.a('function')

		underscoredToCamelCase.should.be.a('function')
		eventName.should.be.a('function')

		Link.render.should.be.a('function')
		Route.should.be.a('function')
		Redirect.should.be.a('function')
		useRoute.should.be.a('function')
		useRouter.should.be.a('function')
		useNavigationStartEffect.should.be.a('function')
		useNavigationEndEffect.should.be.a('function')

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
		useLoading.should.be.a('function')
		updateReducers.should.be.a('function')
		// updateMeta.should.be.a('function')
	})

	it(`should export CommonJS`, () => {
		Library.getState.should.be.a('function')
		Library.getHttpClient.should.be.a('function')

		Library.goto.should.be.a('function')
		Library.redirect.should.be.a('function')

		Library.underscoredToCamelCase.should.be.a('function')
		Library.eventName.should.be.a('function')

		Library.Link.render.should.be.a('function')
		Library.Route.should.be.a('function')
		Library.Redirect.should.be.a('function')
		Library.useRoute.should.be.a('function')
		Library.useRouter.should.be.a('function')
		Library.useNavigationStartEffect.should.be.a('function')
		Library.useNavigationEndEffect.should.be.a('function')

		Library.getCookie.should.be.a('function')
		Library.getPreferredLocales.should.be.a('function')
		Library.getPreferredLocale.should.be.a('function')
		Library.getLanguageFromLocale.should.be.a('function')

		Library.replaceLocation.should.be.a('function')
		Library.pushLocation.should.be.a('function')
		Library.goBack.should.be.a('function')
		Library.goBackTwoPages.should.be.a('function')
		Library.goForward.should.be.a('function')

		Library.useLocation.should.be.a('function')
		Library.useLoading.should.be.a('function')
		Library.updateReducers.should.be.a('function')
		// Library.updateMeta.should.be.a('function')
	})

	it(`should export rendering service`, () => {
		server.should.be.a('function')
		render.should.be.a('function')
		renderError.should.be.a('function')
	})

	it(`should export rendering service (CommonJS)`, () => {
		Server.should.be.a('function')
		Server.default.should.be.a('function')
		Server.render.should.be.a('function')
		Server.renderError.should.be.a('function')
	})
})