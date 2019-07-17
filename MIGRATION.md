# Migration from `react-website@3.x` to `react-pages@1.x`

* Update `react-redux` to `>= 7.1`. Updating from `5.x` to `6.x` has only a [single breaking change](https://github.com/reduxjs/react-redux/issues/1104): `withRef` is replaced with `forwardRef`, and therefore any uses of `wrapperComponentInstance.getWrappedInstance()` are replaced with `actualComponentInstance`. Updating from `6.x` to `7.x` [has no breaking changes](https://github.com/reduxjs/react-redux/releases/tag/v7.0.1).
* Update `react` and `react-dom` to `>= 16.8`.
* Page components no longer receive `params` property (in case anyone used that) in `found@4.x`.
* For those who used `withRouter` decorator previously now there's a better alternative — `useRouter` hook: `const { match, router } = useRouter()`. `withRouter` decorator is therefore removed.