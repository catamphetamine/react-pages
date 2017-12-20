export function get_display_name(Component)
{
	return Component.displayName || Component.name || 'Component'
}