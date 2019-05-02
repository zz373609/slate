import Debug from 'debug'
import ImmutableTypes from 'react-immutable-proptypes'
import React from 'react'
import SlateTypes from 'slate-prop-types'
import warning from 'tiny-warning'
import Types from 'prop-types'

import Void from './void'
import Text from './text'
import getChildrenDecorations from '../utils/get-children-decorations'
import getRenderKey from '../utils/get-render-key'

/**
 * Debug.
 *
 * @type {Function}
 */

const debug = Debug('slate:node')

/**
 * Node.
 *
 * @type {Component}
 */

class Node extends React.Component {
  /**
   * Property types.
   *
   * @type {Object}
   */

  static propTypes = {
    block: SlateTypes.block,
    decorations: ImmutableTypes.list.isRequired,
    editor: Types.object.isRequired,
    isFocused: Types.bool.isRequired,
    isSelected: Types.bool.isRequired,
    node: SlateTypes.node.isRequired,
    parent: SlateTypes.node.isRequired,
    readOnly: Types.bool.isRequired,
  }

  /**
   * Constructor.
   *
   * @param {Object} props
   */

  constructor(props) {
    super(props)

    this.tmp = {
      childRefs: {},
      element: null,
    }
  }

  /**
   * Find the native DOM element for a node at `path`.
   *
   * @param {Array|List} path
   * @return {Object|Null}
   */

  findDOMNode(path) {
    const { childRefs, element } = this.tmp

    if (!path.length) {
      return element || null
    }

    const [index, ...rest] = path
    const ref = childRefs[index]

    if (!ref) {
      return null
    }

    return ref.findDOMNode(rest)
  }

  /**
   * Find the path of a native DOM `el`.
   *
   * @param {Element} el
   * @return {List|Null}
   */

  findPath(el) {
    const { childRefs, element } = this.tmp

    if (el === element) {
      return []
    }

    const keys = Object.keys(childRefs)

    for (const i of keys) {
      const ref = childRefs[i]
      const path = ref.findPath(el)

      if (path) {
        return [i, ...path]
      }
    }

    return null
  }

  /**
   * Debug.
   *
   * @param {String} message
   * @param {Mixed} ...args
   */

  debug = (message, ...args) => {
    const { node } = this.props
    const { object, type } = node
    debug(message, `${object} (${type})`, ...args)
  }

  /**
   * Should the node update?
   *
   * @param {Object} nextProps
   * @param {Object} value
   * @return {Boolean}
   */

  shouldComponentUpdate(nextProps) {
    const { props } = this
    const { editor } = props
    const shouldUpdate = editor.run(
      'shouldNodeComponentUpdate',
      props,
      nextProps
    )
    const n = nextProps
    const p = props

    // If the `Component` has a custom logic to determine whether the component
    // needs to be updated or not, return true if it returns true. If it returns
    // false, we need to ignore it, because it shouldn't be allowed it.
    if (shouldUpdate != null) {
      if (shouldUpdate) {
        return true
      }

      warning(
        shouldUpdate !== false,
        "Returning false in `shouldNodeComponentUpdate` does not disable Slate's internal `shouldComponentUpdate` logic. If you want to prevent updates, use React's `shouldComponentUpdate` instead."
      )
    }

    // If the `readOnly` status has changed, re-render in case there is any
    // user-land logic that depends on it, like nested editable contents.
    if (n.readOnly !== p.readOnly) return true

    // If the node has changed, update. PERF: There are cases where it will have
    // changed, but it's properties will be exactly the same (eg. copy-paste)
    // which this won't catch. But that's rare and not a drag on performance, so
    // for simplicity we just let them through.
    if (n.node !== p.node) return true

    // If the selection value of the node or of some of its children has changed,
    // re-render in case there is any user-land logic depends on it to render.
    // if the node is selected update it, even if it was already selected: the
    // selection value of some of its children could have been changed and they
    // need to be rendered again.
    if (n.isSelected || p.isSelected) return true
    if (n.isFocused || p.isFocused) return true

    // If the decorations have changed, update.
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
    const {
      editor,
      isSelected,
      isFocused,
      node,
      decorations,
      parent,
      block,
      readOnly,
    } = this.props
    const { value } = editor
    const { selection } = value
    const indexes = node.getSelectionIndexes(selection, isSelected)
    const decs = decorations.concat(node.getDecorations(editor))
    const childrenDecorations = getChildrenDecorations(node, decs)

    const children = node.nodes.map((child, i) => {
      const isChildSelected = !!indexes && indexes.start <= i && i < indexes.end
      const Component = child.object === 'text' ? Text : Node
      return (
        <Component
          block={node.object === 'block' ? node : block}
          decorations={childrenDecorations[i]}
          editor={editor}
          isSelected={isChildSelected}
          isFocused={isFocused && isChildSelected}
          key={getRenderKey(child)}
          node={child}
          parent={node}
          readOnly={readOnly}
          // COMPAT: We use this map of refs to lookup a DOM node down the
          // tree of components by path.
          ref={ref => {
            if (ref) {
              this.tmp.childRefs[i] = ref
            } else {
              delete this.tmp.childRefs[i]
            }
          }}
        />
      )
    })

    // Attributes that the developer must mix into the element in their
    // custom node renderer component.
    const attributes = {
      'data-slate-object': node.object,
      dir: null,
      ref: element => (this.element = element),
    }

    // If it's a block node with inline children, add the proper `dir` attribute
    // for text direction.
    if (node.isLeafBlock()) {
      const direction = node.getTextDirection()

      if (direction === 'rtl') {
        attributes.dir = 'rtl'
      }
    }

    const element = editor.run('renderNode', {
      attributes,
      children,
      editor,
      isFocused,
      isSelected,
      node,
      parent,
      readOnly,
    })

    return editor.query('isVoid', node) ? (
      <Void {...this.props}>{element}</Void>
    ) : (
      element
    )
  }
}

/**
 * Export.
 *
 * @type {Component}
 */

export default Node
