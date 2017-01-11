// THIS MODULE IS CURRENTLY NOT USED.
// IT'S JUST HERE AS AN EXAMPLE.

import React from 'react'
import ReactDOM from 'react-dom'

import { render_on_client } from './render'
import { exists }           from '../helpers'

import localize_and_render from '../client'

import normalize_common_settings from './normalize'

// Performs client-side rendering
// along with varios stuff like loading localized messages.
//
// This function is what's gonna be called from the project's code on the client-side.
//
// The following code hasn't been tested.
// Should theoretically work.
// This is not currently being used.
// It's just an example of Redux-less usage.
//
export default function render({ translation }, common)
{
  common = normalize_common_settings(common)

  return localize_and_render
  ({
    translation,
    wrapper: common.wrapper,
    render_on_client,
    render_parameters: { routes: common.routes }
  })
}