// `@catamphetamine/farce` is a fork of `farce` with some changes:
// * `redux` is in `peerDependencies` instead of `dependencies`.
// * Added additional properties in a `location` (`BrowserProtocol`/`ServerProtocol`):
//   * `origin`
//   * `hostname`
//   * `host`
//   * `port`
//   * `protocol`
// * `ServerProtocol` has a different constructor argument: `{ url, origin }` instead of `url`.
import { BrowserProtocol } from '@catamphetamine/farce'

export default function createHistoryProtocol() {
	return new BrowserProtocol()
}