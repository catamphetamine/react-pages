export default function flatten(array: any[]) {
	// `any` here works around TypeScript compiler error:
	// "Property 'flat' does not exist on type 'any[]'.
	//  Do you need to change your target library?
	//  Try changing the 'lib' compiler option to 'es2019' or later"
	if (typeof (array as any).flat === 'function') {
		return (array as any).flat()
	}
	return array.reduce((result, element) => result.concat(element), [])
}