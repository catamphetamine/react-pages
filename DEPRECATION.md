To be deprecated in some future major version update
====================================================

* `getCookie` parameter of `authentication.accessToken` should be moved to the second parameters argument.
* `http.catch`, `http.request` and `authentication.accessToken`: replace `store` parameter with `getState`.
* `authentication.protectedCookie`, `protected_cookie` (internal), `protected_cookie_value` (internal) - the cookies go in favour of `localStorage` (because API URLs are no longer proxied).
* Inside `http client` supply `get_access_token` with a `url` which is before `transform_url`, not after.
* Remove `http.error` parameter of "asynchronous middleware".