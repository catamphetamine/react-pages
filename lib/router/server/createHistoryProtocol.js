import { ServerProtocol } from 'farce'

export default function createHistoryProtocol(url) {
	return new ServerProtocol(url)
}