import React from 'react'
import ReactDOM from 'react-dom'

import { render_on_client } from './render'
import { exists }           from '../helpers'

import localize_and_render from '../client'

// Performs client-side rendering
// along with varios stuff like loading localized messages.
//
// This function is what's gonna be called from the project's code on the client-side.
//
// The following code hasn't been tested.
// Should work.
//
export default function render({ development, create_routes, markup_wrapper, load_localized_messages })
{
  return localize_and_render
  ({
    development,
    load_localized_messages,
    markup_wrapper,
    render_on_client,
    render_parameters: { create_routes }
  })
}