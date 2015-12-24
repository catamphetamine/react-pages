import fs from 'fs'

export default function(webpack_assets_path, development)
{
	let assets

	return function()
	{
		// require() isn't used here to prevent Webpack 
		// from including everything in the bundle during build process
		//
		if (development || !assets)
		{
			// `_webpack_assets_path_` variable will be substituted by Webpack during build process
			assets = JSON.parse(fs.readFileSync(webpack_assets_path))
		}

		return assets
	}
}