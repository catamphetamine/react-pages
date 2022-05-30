export default class TestDocument
{
	constructor(tags = [])
	{
		this.tags = tags
	}

	// Will be mutated.
	getMetaTags()
	{
		return this.tags.slice()
	}

	getTitle()
	{
		return this.title
	}

	setTitle(title)
	{
		this.title = title
	}

	addMetaTag(name, value)
	{
		this.tags.push([name, value])
	}

	isMetaTag(meta, name)
	{
		return meta[0] === name
	}

	getMetaTagValue(meta)
	{
		return meta[1]
	}

	setMetaTagValue(meta, value)
	{
		meta[1] = value
	}

	removeMetaTag = (meta) =>
	{
		this.tags = this.tags.filter(_ => _ !== meta)
	}
}