export default function convertOpenGraphLocaleToLanguageTag(ogLocale) {
	return ogLocale.replace('_', '-')
}