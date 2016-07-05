import React from 'react'
import ReactDOM from 'react-dom'

import { render_on_client } from './render'
import { exists }           from '../helpers'

import localize_and_render from '../client'

import { normalize_common_options } from './normalize'

// Performs client-side rendering
// along with varios stuff like loading localized messages.
//
// This function is what's gonna be called from the project's code on the client-side.
//
// The following code hasn't been tested.
// Should work.
//
export default function render({ development, load_translation }, common)
{
  common = normalize_common_options(common)

  return localize_and_render
  ({
    development,
    load_translation,
    wrapper: common.wrapper,
    render_on_client,
    render_parameters: { create_routes: common.create_routes }
  })
}