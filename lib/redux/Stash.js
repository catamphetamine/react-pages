export default class Stash {
	getRootRouteComponentProps() {
		return this.rootRouteComponentProps
	}
	setRootRouteComponentProps(props) {
		this.rootRouteComponentProps = props
	}

	getRootRouteComponentMeta() {
		return this.rootRouteComponentMeta
	}
	setRootRouteComponentMeta(meta) {
		this.rootRouteComponentMeta = meta
	}

	getPageRouteComponentProps() {
		return this.pageRouteComponentProps
	}
	setPageRouteComponentProps(props) {
		this.pageRouteComponentProps = props
	}

	getPageRouteComponentMeta() {
		return this.pageRouteComponentMeta
	}
	setPageRouteComponentMeta(meta) {
		this.pageRouteComponentMeta = meta
	}
}