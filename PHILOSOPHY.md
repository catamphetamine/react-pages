# Philosophy

Miscellaneous

## World-Wide Web Concepts

The original concept of the web was one of a network of "resources" interconnected with "hyperlinks": a user could query a "resource" by a "Universal Resource Link" (URL) and then travel to any of the connected "resources" just by navigating the corresponding hyperlinks, and then it would all repeat recursively therefore interconnecting each and every "resource" into a giant interconnected web (hence the name). The "resources" were meant to be "documents", like reports, articles, papers, news, books, etc.

The web wasn't meant at all for "applications". At first javascript was only used to bring some naive interactivity to static "documents", like following the cursor with a sprinkle, or adding christmas snow to a page, or applying some effect to a picture upon mouseover. Initially javascript was never meant to be a means of operating on the page's "content". It was just for "presentation" ("view"), not the "content".

Ajax wasn't originally meant for "content" too: it was just for tiny utility things like hitting a "Like" button without needlessly refreshing the whole freaking page, but it was then too turned into a machinery for fetching a page's "content".

And so [the Web became broken](https://ponyfoo.com/articles/stop-breaking-the-web). And to completely fix that and make the Web 100% pure again total Server Side Rendering for each dynamic website is the only way to go. This is still a purely esthetical argument and nobody would really care (except purists and perfectionists) if it didn't come to being able to be indexed by Google...

## React-router + Redux

Early attempts at marrying React-Router and Redux built itself upon an idea that React-Router state should be managed by Redux: the current location was part of Redux state and when that part of Redux state changed then the routing would be performed, therefore a user could perform navigation just by `dispatch()`ing an action, and also had an easy access to the current location in Redux state.

While this is an elegant and smart solution, still I don't feel like React-Router state really belongs to Redux application state. It's like two parallel worlds: the navigation world and the application model world. They don't depend on each other in any way and they're conceptually different and not interconnected. So, I think that React-Router should manage its state by itself.

Then, one may ask, why is this library using `dispatch()` for redirection and navigation? And for page loading?

The answer is: it could easily be some random global variable instead, like `window.__history__` and `redirect()` would just call `window.__history__.replace()`, but, since javascript is single-threaded, on the server side it simply wouldn't work because that global `window.__history__` variable would be shared among all clients which would result in a really weird navigation for all of them. Ok, so the solution is actually simple: just declare some `var history_storage = { history }` and then just pass it around in all functions. This would work, but it would not only introduce a lot of spaghetti code but also would really be a re-implementation of already existing Redux store. And why invent another wheel then. Just use the one you already have if it doesn't interfere (and it doesn't). So that the reason why this library has `dispatch()` for navigation but still doesn't store router state in Redux state.