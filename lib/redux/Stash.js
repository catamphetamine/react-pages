export default class Stash {
	getRootComponentProps() {
		return this.rootComponentProps
	}
	setRootComponentProps(props) {
		this.rootComponentProps = props
	}

	getRootComponentMeta() {
		return this.rootComponentMeta
	}
	setRootComponentMeta(meta) {
		this.rootComponentMeta = meta
	}

	getPageComponentProps() {
		return this.pageComponentProps
	}
	setPageComponentProps(props) {
		this.pageComponentProps = props
	}

	getPageComponentMeta() {
		return this.pageComponentMeta
	}
	setPageComponentMeta(meta) {
		this.pageComponentMeta = meta
	}
}