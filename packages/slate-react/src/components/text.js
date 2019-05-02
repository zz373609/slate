import Debug from 'debug'
import ImmutableTypes from 'react-immutable-proptypes'
import Leaf from './leaf'
import React from 'react'
import SlateTypes from 'slate-prop-types'
import Types from 'prop-types'
import { PathUtils } from 'slate'

import getRenderKey from '../utils/get-render-key'

/**
 * Debug.
 *
 * @type {Function}
 */

const debug = Debug('slate:node')

/**
 * Text.
 *
 * @type {Component}
 */

class Text extends React.Component {
  /**
   * Property types.
   *
   * @type {Object}
   */

  static propTypes = {
    block: SlateTypes.block,
    decorations: ImmutableTypes.list.isRequired,
    editor: Types.object.isRequired,
    node: SlateTypes.node.isRequired,
    parent: SlateTypes.node.isRequired,
    style: Types.object,
  }

  /**
   * Default prop types.
   *
   * @type {Object}
   */

  static defaultProps = {
    style: null,
  }

  /**
   * Constructor.
   *
   * @param {Object} props
   */

  constructor(props) {
    super(props)

    this.tmp = {
      element: null,
    }
  }

  /**
   * Debug.
   *
   * @param {String} message
   * @param {Mixed} ...args
   */

  debug = (message, ...args) => {
    debug(message, `(text)`, ...args)
  }

  /**
   * Find the native DOM element for a node at `path`.
   *
   * @param {Array|List} path
   * @return {Object|Null}
   */

  findDOMNode(path) {
    const element = path.length === 0 ? this.tmp.element || null : null
    return element
  }

  /**
   * Find the path of a native DOM `el`.
   *
   * @param {Element} el
   * @return {Array|Null}
   */

  findPath(el) {
    const path = el === this.tmp.element ? [] : null
    return path
  }

  /**
   * Should the node update?
   *
   * @param {Object} nextProps
   * @param {Object} value
   * @return {Boolean}
   */

  shouldComponentUpdate = nextProps => {
    const { props } = this
    const n = nextProps
    const p = props

    // If the node has changed, update. PERF: There are cases where it will have
    // changed, but it's properties will be exactly the same (eg. copy-paste)
    // which this won't catch. But that's rare and not a drag on performance, so
    // for simplicity we just let them through.
    if (n.node !== p.node) return true

    // If the node parent is a block node, and it was the last child of the
    // block, re-render to cleanup extra `\n`.
    if (n.parent.object === 'block') {
      const pLast = p.parent.nodes.last()
      const nLast = n.parent.nodes.last()
      if (p.node === pLast && n.node !== nLast) return true
    }

    // Re-render if the current decorations have changed.
    if (!n.decorations.equals(p.decorations)) return true

    // Otherwise, don't update.
    return false
  }

  /**
   * Render.
   *
   * @return {Element}
   */

  render() {
    this.debug('render', this)

    const { decorations, editor, node, block, parent, style } = this.props
    const { value } = editor
    const { document } = value
    const pathMap = document.getNodesToPathsMap()
    const path = pathMap.get(node)

    const decs = decorations.filter(d => {
      const { start, end } = d

      // If either of the decoration's keys match, include it.
      if (start.path.equals(path) || end.path.equals(path)) return true

      // Otherwise, if the decoration is in a single node, it's not ours.
      if (start.path.equals(end.path)) return false

      // If the node's path is before the start path, ignore it.
      if (PathUtils.compare(path, start.path) === -1) return false

      // If the node's path is after the end path, ignore it.
      if (PathUtils.compare(path, end.path) === 1) return false

      // Otherwise, include it.
      return true
    })

    // PERF: Take advantage of cache by avoiding arguments
    const leaves = decs.size === 0 ? node.getLeaves() : node.getLeaves(decs)
    let o = 0

    const children = leaves.map((leaf, i) => {
      const { text, marks } = leaf
      const key = getRenderKey(leaf)
      const offset = o
      o += text.length

      return (
        <Leaf
          key={key}
          block={block}
          editor={editor}
          index={i}
          marks={marks}
          node={node}
          offset={offset}
          parent={parent}
          leaves={leaves}
          text={text}
        />
      )
    })

    return (
      <span
        data-slate-object="text"
        style={style}
        ref={element => (this.tmp.element = element)}
      >
        {children}
      </span>
    )
  }
}

/**
 * Export.
 *
 * @type {Component}
 */

export default Text
