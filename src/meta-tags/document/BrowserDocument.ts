import type { Document } from './Document.d.js'

export default class BrowserDocument implements Document<HTMLMetaElement> {
	// Will be mutated.
	getMetaTags() {
		return Array.prototype.slice.call(document.head.getElementsByTagName('meta'), 0)
	}

	getTitle() {
		return document.title
	}

	setTitle(title: string) {
		document.title = title
	}

	addMetaTag(name: string, value: string) {
		document.head.appendChild(this.createMetaTag(name, value))
	}

	/**
	 * Creates `<meta/>` tag with a `value`.
	 */
	createMetaTag(name: string, value: string) {
		const meta = document.createElement('meta')
		if (name === 'charset') {
			meta.setAttribute('charset', value)
		} else {
			meta.setAttribute(getMetaAttributeFor(name), name)
			meta.setAttribute('content', value)
		}
		return meta
	}

	isMetaTag(element: HTMLMetaElement, name: string) {
		if (name === 'charset') {
			return element.hasAttribute('charset')
		}
		return element.getAttribute(getMetaAttributeFor(name)) === name
	}

	getMetaTagValue(element: HTMLMetaElement) {
		if (element.hasAttribute('charset')) {
			return element.getAttribute('charset') || undefined
		}
		return element.getAttribute('content') || undefined
	}

	setMetaTagValue(element: HTMLMetaElement, value: string) {
		if (element.hasAttribute('charset')) {
			return element.setAttribute('charset', value)
		}
		element.setAttribute('content', value)
	}

	removeMetaTag(element: HTMLMetaElement) {
		if (element.parentNode) {
			element.parentNode.removeChild(element)
		}
	}
}

/**
 * Get `<meta/>` "name" attribute.
 */
export function getMetaAttributeFor(name: string) {
	return name.indexOf(':') >= 0 ? 'property' : 'name'
}