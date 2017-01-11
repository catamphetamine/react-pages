import React from 'react'
import Link from './Link'

export default function IndexLink(props)
{
	return <Link { ...props } onlyActiveOnIndex={ true }/>
}