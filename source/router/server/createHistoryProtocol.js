import ServerProtocol from 'farce/ServerProtocol'

export default function createHistoryProtocol(url) {
	return new ServerProtocol(url)
}