// This was an experiment on explicit URL params declaration on each page:
//
// PageComponent.params = {
// 	id: {
// 		// `type` can be "string" or "number".
// 		type: 'string'
// 	}
// }
//
// And then in `./redux/preload/preload.js`:
//
// import { getPageParams } from '../../params'
//
// preload = generatePreloadChain(
// 	...
// 	params: getPageParams(components, params)
// )
//
// This idea was dicarded due to being too verbose.
// A deloper would just prefer `params` being a random un-schemed object.
//
// In case of uncommenting this, add a note in the readme
// that `onBeforeNavigate()` `params` aren't parsed.
//
// export function getPageParams(components, params) {
// 	return components
// 		.filter(component => component.params)
// 		.reduce(
// 			(result, componentParams) => ({
// 				...result,
// 				...Object.keys(componentParams).reduce(
// 					(result, parameterName) => ({
// 						...result,
// 						[parameterName]: parseParameter(
// 							params[parameterName],
// 							componentParams[parameterName].type
// 						)
// 					}),
// 					{}
// 				)
// 			}),
// 			{}
// 		)
// }
//
// function parseParameter(value, type) {
// 	switch (type) {
// 		case 'string':
// 			return value
// 		case 'number':
// 			return +value
// 		default:
// 			throw new Error(`[react-pages] Unsupported URL parameter type: ${type}`)
// 	}
// }