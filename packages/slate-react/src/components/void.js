import Debug from 'debug'
import React from 'react'
import SlateTypes from 'slate-prop-types'
import Types from 'prop-types'

import Text from './text'

/**
 * Debug.
 *
 * @type {Function}
 */

const debug = Debug('slate:void')

/**
 * Void.
 *
 * @type {Component}
 */

class Void extends React.Component {
  /**
   * Property types.
   *
   * @type {Object}
   */

  static propTypes = {
    block: SlateTypes.block,
    children: Types.any.isRequired,
    editor: Types.object.isRequired,
    node: SlateTypes.node.isRequired,
    parent: SlateTypes.node.isRequired,
    readOnly: Types.bool.isRequired,
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
    const id = `${object} (${type})`
    debug(message, `${id}`, ...args)
  }

  /**
   * Render.
   *
   * @return {Element}
   */

  render() {
    const { props } = this
    const { block, children, decorations, editor, node, readOnly } = props
    const text = node.getFirstText()
    const Tag = node.object === 'block' ? 'div' : 'span'

    // Render the void node's text node, which will catch the cursor when it the
    // void node is navigated to with the arrow keys. Having this text node
    // there means the browser continues to manage the selection natively, so it
    // keeps track of the right offset when moving across the block.
    const spacer = readOnly ? null : (
      <Tag
        data-slate-spacer
        style={{
          height: '0',
          color: 'transparent',
          outline: 'none',
          position: 'absolute',
        }}
      >
        <Text
          block={node.object === 'block' ? node : block}
          decorations={decorations}
          editor={editor}
          node={text}
          parent={node}
          readOnly={readOnly}
        />
      </Tag>
    )

    const content = (
      <Tag contentEditable={readOnly ? null : false}>{children}</Tag>
    )

    this.debug('render', { props })

    return (
      <Tag
        data-slate-void
        data-slate-object={node.object}
        contentEditable={readOnly || node.object === 'block' ? null : false}
      >
        {spacer}
        {content}
      </Tag>
    )
  }
}

/**
 * Export.
 *
 * @type {Component}
 */

export default Void
