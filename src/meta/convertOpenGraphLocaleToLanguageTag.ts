export default function convertOpenGraphLocaleToLanguageTag(ogLocale: string) {
	return ogLocale.replace('_', '-')
}