// Customization of `http` utility
// which can be used inside Redux action creators
export default function set_up_http_client(http_client, { store, on_before_send })
{
	if (on_before_send)
	{
		http_client.on_before_send(function(request)
		{
			// If using Flux, then add `store` as a parameter 
			// for `http_client` customization function
			on_before_send(request, { store })
		})
	}
}