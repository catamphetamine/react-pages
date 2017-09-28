export function get_display_name(Wrapped)
{
	return Wrapped.displayName || Wrapped.name || 'Component'
}