import OBJECTS from '../constants/objects'

/**
 * Check whether a `value` is an object of `type`.
 *
 * @param {string} type
 * @param {any} value
 * @return {boolean}
 */

function isObject(type, value) {
  return !!(value && value[OBJECTS[type]])
}

/**
 * Export.
 *
 * @type {Object}
 */

export default isObject
