import { describe, it } from 'mocha'
import { expect } from 'chai'

import Library from '../../lib/index.cjs'
import Server from '../../lib/server.cjs'

import {
	getHttpClient,
	goto,
	redirect,
	// ReduxModule,
	underscoredToCamelCase,
	eventName,
	Link,
	getCookie,
	getPreferredLocale,
	getLanguageFromLocale,
	// replaceLocation,
	// pushLocation,
	goBack,
	goBackTwoPages,
	goForward,
	Redirect,
	useRoute,
	useRouter,
	useBeforeNavigateToAnotherPage,
	useBeforeRenderAnotherPage,
	// useAfterNavigatedToAnotherPage,
	useAfterRenderedThisPage,
	useBeforeRenderNewPage,
	useAfterRenderedNewPage,
	// useLatestNavigationLocation,
	usePageStateSelector,
	usePageStateSelectorOutsideOfPage,
	useLocation,
	useGoBack,
	useGoForward,
	useReplaceUrlQuery,
	useNavigate,
	useRedirect,
	useLoading,
	updateReducers
	// updateMeta
} from '../../lib/index.js'

import server, {
	render,
	renderError
} from '../../lib/server.js'

describe(`exports`, function() {
	it(`should export ES6`, () => {
		expect(getHttpClient).to.be.a('function')

		expect(goto).to.be.a('function')
		expect(redirect).to.be.a('function')

		expect(underscoredToCamelCase).to.be.a('function')
		expect(eventName).to.be.a('function')

		expect(Link.render).to.be.a('function')
		expect(Redirect).to.be.a('function')
		expect(useRoute).to.be.a('function')
		expect(useRouter).to.be.a('function')
		expect(useBeforeRenderAnotherPage).to.be.a('function')
		expect(useBeforeNavigateToAnotherPage).to.be.a('function')
		// expect(useAfterNavigatedToAnotherPage).to.be.a('function')
		expect(useAfterRenderedThisPage).to.be.a('function')
		expect(useBeforeRenderNewPage).to.be.a('function')
		expect(useAfterRenderedNewPage).to.be.a('function')

		expect(getCookie).to.be.a('function')
		expect(getPreferredLocale).to.be.a('function')
		expect(getLanguageFromLocale).to.be.a('function')

		// expect(replaceLocation).to.be.a('function')
		// expect(pushLocation).to.be.a('function')
		expect(goBack).to.be.a('function')
		expect(goBackTwoPages).to.be.a('function')
		expect(goForward).to.be.a('function')

		// expect(useLatestNavigationLocation).to.be.a('function')
		expect(usePageStateSelector).to.be.a('function')
		expect(usePageStateSelectorOutsideOfPage).to.be.a('function')
		expect(useLocation).to.be.a('function')
		expect(useGoBack).to.be.a('function')
		expect(useGoForward).to.be.a('function')
		expect(useReplaceUrlQuery).to.be.a('function')
		expect(useNavigate).to.be.a('function')
		expect(useRedirect).to.be.a('function')
		expect(useLoading).to.be.a('function')
		expect(updateReducers).to.be.a('function')
		// expect(updateMeta).to.be.a('function')
	})

	it(`should export CommonJS`, () => {
		expect(Library.getHttpClient).to.be.a('function')

		expect(Library.goto).to.be.a('function')
		expect(Library.redirect).to.be.a('function')

		expect(Library.underscoredToCamelCase).to.be.a('function')
		expect(Library.eventName).to.be.a('function')

		expect(Library.Link.render).to.be.a('function')
		expect(Library.Redirect).to.be.a('function')
		expect(Library.useRoute).to.be.a('function')
		expect(Library.useRouter).to.be.a('function')
		expect(Library.useBeforeRenderAnotherPage).to.be.a('function')
		expect(Library.useBeforeNavigateToAnotherPage).to.be.a('function')
		// expect(Library.useAfterNavigatedToAnotherPage).to.be.a('function')
		expect(Library.useAfterRenderedThisPage).to.be.a('function')
		expect(Library.useBeforeRenderNewPage).to.be.a('function')
		expect(Library.useAfterRenderedNewPage).to.be.a('function')

		expect(Library.getCookie).to.be.a('function')
		expect(Library.getPreferredLocale).to.be.a('function')
		expect(Library.getLanguageFromLocale).to.be.a('function')

		// expect(Library.replaceLocation).to.be.a('function')
		// expect(Library.pushLocation).to.be.a('function')
		expect(Library.goBack).to.be.a('function')
		expect(Library.goBackTwoPages).to.be.a('function')
		expect(Library.goForward).to.be.a('function')

		// expect(Library.useLatestNavigationLocation).to.be.a('function')
		expect(Library.usePageStateSelector).to.be.a('function')
		expect(Library.usePageStateSelectorOutsideOfPage).to.be.a('function')
		expect(Library.useLocation).to.be.a('function')
		expect(Library.useGoBack).to.be.a('function')
		expect(Library.useGoForward).to.be.a('function')
		expect(Library.useReplaceUrlQuery).to.be.a('function')
		expect(Library.useNavigate).to.be.a('function')
		expect(Library.useRedirect).to.be.a('function')
		expect(Library.useLoading).to.be.a('function')
		expect(Library.updateReducers).to.be.a('function')
		// Library.updateMeta).to.be.a('function')
	})

	it(`should export rendering service`, () => {
		expect(server).to.be.a('function')
		expect(render).to.be.a('function')
		expect(renderError).to.be.a('function')
	})

	it(`should export rendering service (CommonJS)`, () => {
		expect(Server).to.be.a('function')
		expect(Server.default).to.be.a('function')
		expect(Server.render).to.be.a('function')
		expect(Server.renderError).to.be.a('function')
	})
})