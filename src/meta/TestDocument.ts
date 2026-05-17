import type { Document } from './Document.d.js'

type MetaTag = [string, string]

export default class TestDocument implements Document<MetaTag> {
	tags: MetaTag[] = []
	title: string = ''

	constructor(tags: MetaTag[]) {
		if (tags) {
			this.tags = tags
		}
	}

	// Will be mutated.
	getMetaTags() {
		return this.tags.slice()
	}

	getTitle() {
		return this.title
	}

	setTitle(title: string) {
		this.title = title
	}

	addMetaTag(name: string, value: string) {
		this.tags.push([name, value])
	}

	isMetaTag(meta: MetaTag, name: string) {
		return meta[0] === name
	}

	getMetaTagValue(meta: MetaTag) {
		return meta[1]
	}

	setMetaTagValue(meta: MetaTag, value: string) {
		meta[1] = value
	}

	removeMetaTag = (meta: MetaTag) => {
		this.tags = this.tags.filter(_ => _ !== meta)
	}
}