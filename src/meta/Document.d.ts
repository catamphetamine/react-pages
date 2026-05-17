export interface Document<MetaTag = any> {
	getMetaTags(): MetaTag[];
	getTitle(): string;
	setTitle(title: string): void;
	addMetaTag(name: string, value: string): void;
	isMetaTag(meta: MetaTag, name: string): boolean;
	getMetaTagValue(meta: MetaTag): string;
	setMetaTagValue(meta: MetaTag, value: string): void;
	removeMetaTag(meta: MetaTag): void;
}