export interface Document<MetaElement = any> {
	getMetaTags(): MetaElement[];
	getTitle(): string;
	setTitle(title: string): void;
	addMetaTag(name: string, value: string): void;
	isMetaTag(element: MetaElement, name: string): boolean;
	getMetaTagValue(element: MetaElement): string | undefined;
	setMetaTagValue(element: MetaElement, value: string): void;
	removeMetaTag(element: MetaElement): void;
}