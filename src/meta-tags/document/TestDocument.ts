import type { Document } from './Document.d.js'

type MetaElement = [string, string]

export default class TestDocument implements Document<MetaElement> {
	elements: MetaElement[] = []
	title: string = ''

	constructor(elements?: MetaElement[]) {
		if (elements) {
			this.elements = elements
		}
	}

	// Will be mutated.
	getMetaTags() {
		return this.elements.slice()
	}

	getTitle() {
		return this.title
	}

	setTitle(title: string) {
		this.title = title
	}

	addMetaTag(name: string, value: string) {
		this.elements.push([name, value])
	}

	isMetaTag(element: MetaElement, name: string) {
		return element[0] === name
	}

	getMetaTagValue(element: MetaElement) {
		return element[1]
	}

	setMetaTagValue(element: MetaElement, value: string) {
		element[1] = value
	}

	removeMetaTag = (element: MetaElement) => {
		this.elements = this.elements.filter(_ => _ !== element)
	}
}