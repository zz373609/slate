const keyMap = new WeakMap()
let n = 0

/**
 * Retrieve a persistent key for a given immutable `node` to use when rendering.
 *
 * @param {Node} node
 * @return {String}
 */

const getKey = node => {
  if (keyMap.has(node)) {
    return keyMap.get(node)
  } else {
    const key = n++
    keyMap.set(node, key)
    return key
  }
}

export default getKey
