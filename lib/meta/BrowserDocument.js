export default class BrowserDocument
{
	// Will be mutated.
	getMetaTags()
	{
		return Array.prototype.slice.call(document.head.getElementsByTagName('meta'), 0)
	}

	getTitle()
	{
		return document.title
	}

	setTitle(title)
	{
		document.title = title
	}

	addMetaTag(name, value)
	{
		document.head.appendChild(this.createMetaTag(name, value))
	}

	/**
	 * Creates `<meta/>` tag with a `value`.
	 * @return {Element}
	 */
	createMetaTag(name, value)
	{
		const meta = document.createElement('meta')
		if (name === 'charset') {
			meta.setAttribute('charset', value)
		} else {
			meta.setAttribute(getMetaAttributeFor(name), name)
			meta.setAttribute('content', value)
		}
		return meta
	}

	isMetaTag(meta, name)
	{
		if (name === 'charset') {
			return meta.hasAttribute('charset')
		}
		return meta.getAttribute(getMetaAttributeFor(name)) === name
	}

	getMetaTagValue(meta)
	{
		if (meta.getAttribute('charset')) {
			return meta.getAttribute('charset')
		}
		return meta.getAttribute('content')
	}

	setMetaTagValue(meta, value)
	{
		if (meta.getAttribute('charset')) {
			return meta.setAttribute('charset', value)
		}
		meta.setAttribute('content', value)
	}

	removeMetaTag(meta)
	{
		meta.parentNode.removeChild(meta)
	}
}


/**
 * Get `<meta/>` "name" attribute.
 * @return {string}
 */
export function getMetaAttributeFor(name)
{
	return name.indexOf(':') >= 0 ? 'property' : 'name'
}