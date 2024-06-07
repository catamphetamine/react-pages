// The concept of a "page" is: a "page" is something within a certain pathname.
// I.e. changing URL query parameters or "hash" isn't considered "going to another page",
// even though the URL value in the address bar changes in those cases.
// Only changing URL query `pathname` is considered "going to another page".
//
// This is more of a question about the conventions that're used when architecturing
// a website's navigation. Should URL query parameters or "hash" represent "another page"?
// Or should they only represent slight "modifications" to the "current page"?
//
// For example, a `/search` page might have a URL query part where search filter values are stored.
// When a user refreshes the web page, the filter values get restored from the URL, which is convenient.
// But at the same time, chaning the URL query parameters dynamically when selecting or unselecting
// certain filters is not conceptually considered as "going to another page".
//
// There used to be those old websites that used the "hash" part for `pathname`
// before `history` API was supported across the web browsers. Those cases can be ignored.
//
// There also used to be approaches to building websites in the 90'es and in the 2000's
// when they specified parameters like `userId` not in the `pathname` but in URL query instead:
// it looked like "/users?id=123" rather than the modern variant "/users/123".
// Those cases can be ignored too because no one does that in the modern age
// of compying with the concepts of URL, "resource", REST, etc.
//
// So the convention is that URL query parameters shouldn't be used to represent another resource.
// They can only represent "customization" for retrieving a certain (same) resource.
//
// -------------------------------------------------------------------------------
//
// There's an edge case though when such "same page" detection wouldn't work.
// That would happen when navigating from same page to same page.
//
// For example, consider a case of a website like "Reddit" that consists of "channels".
// Suppose a user has navigated to a "channel" page and then decides to refresh the list of thread
// on the channel by clicking the hyperlink to the same channel once again:
// in that case, `react-pages` won't remount the page `Component`, even though from the user's
// point of view it is considered navigating to another instance of same page, i.e. the page
// should've been reset in this case from the user's point of view.
//
export function getPageKey(location) {
	return location.pathname
}

export default function isSamePage(location1, location2) {
	return getPageKey(location1) === getPageKey(location2)
}