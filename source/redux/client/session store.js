import { readState, saveState } from 'history/lib/DOMStateStorage'

const STATE_KEY_PREFIX = '@@react-website/'

/**
 * Gets an object from `window.sessionStorage`.
 * Note: data in `window.sessionStorage` survives page reload.
 */
export const get_from_session = (prefix, key) => readState(compute_key(prefix, key))

/**
 * Stores an object in `window.sessionStorage`.
 * Note: data in `window.sessionStorage` survives page reload.
 */
export const store_in_session = (prefix, key, data) => saveState(compute_key(prefix, key), data)

/**
 * Generates a key from `prefix` and `key`.
 */
const compute_key = (prefix, key) => `${STATE_KEY_PREFIX}${prefix}|${key}`