# Caching

## Motivation

React Server-Side Rendering takes some time, especially on complex pages. Add to this the time to query a database and [the recommended watermark of 200ms](https://developers.google.com/speed/docs/insights/Server) can be easily exceeded.

## Finding solutions

In an ideal world, every HTTP request would just get a rendered page and [the web wouldn't be broken anymore](https://ponyfoo.com/articles/stop-breaking-the-web). All web pages would be true Documents (aka "Resources"), like in the good old days of the early World Wide Web.

But, in reality, everything has a price, and as the load grows this price rises. Which brings a question: is server-side rendering needed that much? And why is it needed?

Look at Facebook, for example. The founding fathers of React, they still respond with an empty page which is then fully rendered in the web browser. And they're not even interested in React server-side rendering that much.

Who said server-side rendering is needed anyway. I guess (WWW purists aside) that's mainly for the SEO. Even though modern web crawlers [know](https://www.deepcrawl.com/knowledge/best-practice/google-javascript-and-the-ajax-crawling-scheme/) how to execute javascript and wait for AJAXed data, still it would be slightly better to serve them prerendered pages because that would mean slightly faster page loading times which results in higher ranking (and faster indexing).

So is server-side rendering really needed that much? I guess it's not, but it's always a nice-to-have feature.

## Traditional caching

If you read, for example, those two articles on Reddit architecture ([first](http://highscalability.com/blog/2010/5/17/7-lessons-learned-while-building-reddit-to-270-million-page.html), [second](http://highscalability.com/blog/2013/8/26/reddit-lessons-learned-from-mistakes-made-scaling-to-1-billi.html)), they talk there about caching everything in Memcache. The approach is as follows.

Each entity has a visual representation (e.g. a thread has a `<li>...</li>` representation), and when that entity is updated, both its data and visual representation are updated in Memcache. For example, if a thread is renamed, the new data object is written into Memcache, and the prerendered `<li>...</li>` is updated too inside Memcache. Then, when a user requests a page with a list of the most recent threads, first the most recent threads are fetched from Memcache, and then their respective `<li>...</li>` markup is retrieved from Memcache (they say they can issue up to 10 000 Memcache requests just to render a single page).

This is a good example of highload architecture, and it would work in React too, but React is currently cumbersome when it comes to partial caching tricks (e.g. caching a header and a footer while rendering only the content part) because of having those `react-dataid` and `react-data-checksum` attributes guarding the resulting HTML markup integrity. I.e. one can't just render the content of a page and then inject the already cached header and footer markup there because then `react-dataid` counters would be messed up and `react-data-checksum` wouldn't match, so React would just discard the whole server-rendered markup and rerender it from scratch in the web browser, which is stupid. See [this discussion in `facebook/react` repo](https://github.com/facebook/react/issues/5869#issuecomment-250967382) for more info. Facebook seems not interested in fixing this issue since they're not using server-side rendering at all. There was [an effort](https://github.com/aickin/react-dom-stream) to fork React and fix that particular disability but the contributor obviously didn't manage to keep up with the pace and the project got stuck at React 0.14 and was finally abandoned.

There is however an interesting project out of Walmart Labs worth checking out: [`react-ssr-optimization`](https://github.com/walmartlabs/react-ssr-optimization). It takes another approach from `react-dom-stream` and istead of forking and patching React library itself it injects some bootstrapping code inside it via a Node.js `require()` hook. This might turn out to be a good solution (I haven't tried it myself).

And of course there are a handful of other independent efforts to fix React server side rendering, like [Rapscallion](http://formidable.com/blog/2017/introducing-rapscallion/) and [`fast-react-server`](https://github.com/alt-j/fast-react-server).

## Caching the whole page

Theorectially, some kind of SEO-friendly generic prerender of a page could be cached (say, the text of an article), and then, on the client side, inside `componentDidMount` it could be further customized for this particular point in time and space: say, a user bar could be dynamically loaded and added at the top of the page, or a comments section could be fetched and rendered at the bottom of the page.

This way caching whole pages would become possible. Still, there's a gotcha with this approach. Say, a user creates a private item listing, that only he and his friends can view. One of these friends views the listing putting it into Memcache on the server side, and then an unregistered stranger walks by, requesting this same URL and getting the cached markup. That's a security hole.

So, caching the same page for everyone even with further client-side customization isn't an option. But, the whole page could be safely cached, say, for a single non-volatile user. Would it make sense? Yes, if this user is "anonymous" (aka "guest"): all unregistered users may be viewed as a single giant special "guest" user requesting loads of pages per second.

So, it's settled then: caching whole pages is possible only for unregistered users.

## Cache invalidation

So, the pages are cached for guests. How do they get rerendered when the data is updated? I guess, there's no magic solution for this. In case of Reddit, each time an entity is updated, it is rerendered into Memcache, and each time a random page is requested it still needs to go into Memcache for the actual data, to get the displayed entity IDs, in order to later compose the page of the prerendered pieces for these entities.

Since in React the composing approach doesn't currently work, this approach won't be taken. A somewhat similar approach would be comparing the whole dataset fetched from Memcache with the dataset for the cached rendered page: if these two datasets are the same, then the page is fetched from the cache; otherwise, the page is rerendered with the new dataset and put into the cache.

Tracking a dataset could be a non-trivial and fragile task in an abstract paradigm but since Redux is used, and since it's React with its "functional" stateless approach, the "state" of the page actually is the page, so the dataset is basically the Redux state, and if the Redux state after page loading is equal to the Redux state of the cached page, then the page is fetched from the cache; otherwise, the page is rerendered with the new dataset and put into the cache.

## Cache key

So, the caching concept seems to be finished. As for the specifics, for example, what is the page's cache key gonna be for a rendered React page?

It could be simply a URL but then an attacker could just spam a load of random URLs (with random GET query parameters) and overflow the cache.

Since `react-router` is used, a page's key could be inferred from the `<Route/>` component chain, along with their `params` (that would be the `path` part of the URL), plus the GET query parameters. All possible GET query parameters should be defined as `enum`s. If some GET query parameters aren't enums (i.e. can take arbitrary values) then cache overflow attack would be possible to perform, so maybe such pages shouldn't be cached as a whole. Enumerated GET query parameters can be taken from `propTypes.location.query` of the last `<Route/>` component.

## Relative dates

One more gotcha are relative dates and times (e.g. "an hour ago"). These most likely need to be rendered as absolute ones (e.g. "01.02.2016, 18:00") on the server-side, meaning that a special flag needs to be introduced (maybe a global variable, like `__SERVER__`, which is not that elegant; or maybe a Redux state property like `getState().render.server === true`).