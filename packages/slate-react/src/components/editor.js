import Debug from 'debug'
import React from 'react'
import SlateTypes from 'slate-prop-types'
import Types from 'prop-types'
import warning from 'slate-dev-warning'
import { Editor as Controller } from 'slate'
import memoizeOne from 'memoize-one'

import EVENT_HANDLERS from '../constants/event-handlers'
import PLUGINS_PROPS from '../constants/plugin-props'
import AfterPlugin from '../plugins/after'
import BeforePlugin from '../plugins/before'
import noop from '../utils/noop'

/**
 * Debug.
 *
 * @type {Function}
 */

const debug = Debug('slate:editor')

/**
 * Editor.
 *
 * @type {Component}
 */

class Editor extends React.Component {
  /**
   * Property types.
   *
   * @type {Object}
   */

  static propTypes = {
    autoCorrect: Types.bool,
    autoFocus: Types.bool,
    className: Types.string,
    onChange: Types.func,
    placeholder: Types.any,
    plugins: Types.array,
    readOnly: Types.bool,
    role: Types.string,
    schema: Types.object,
    spellCheck: Types.bool,
    style: Types.object,
    tabIndex: Types.number,
    value: SlateTypes.value.isRequired,
  }

  /**
   * Default properties.
   *
   * @type {Object}
   */

  static defaultProps = {
    autoFocus: false,
    autoCorrect: true,
    onChange: noop,
    plugins: [],
    readOnly: false,
    schema: {},
    spellCheck: true,
  }

  /**
   * Constructor.
   *
   * @param {Object} props
   */

  constructor(props) {
    super(props)
    this.resolvePlugins = memoizeOne(this.resolvePlugins)
    this.state = {}

    this.tmp = {
      mounted: false,
      change: null,
      resolves: 0,
      updates: 0,
    }

    const plugins = this.resolvePlugins(props.plugins, props.schema)
    const { value } = props
    const { onChange } = this
    this.controller = new Controller({ plugins, value, onChange })
  }

  /**
   * When the component first mounts, focus the editor if `autoFocus` is set,
   * and then flush a queued change if one exists.
   */

  componentDidMount() {
    this.tmp.mounted = true
    this.tmp.updates++

    if (this.props.autoFocus) {
      this.controller.change(c => c.focus())
    }

    if (this.tmp.change) {
      this.props.onChange(this.tmp.change)
    }
  }

  /**
   * When the component updates, ensure that it's not re-resolving often, and
   * then flush a queued change if one exists.
   */

  componentDidUpdate(prevProps) {
    this.tmp.updates++

    // If we've resolved a few times already, and it's exactly in line with
    // the updates, then warn the user that they may be doing something wrong.
    warning(
      this.tmp.resolves < 5 || this.tmp.resolves !== this.tmp.updates,
      'A Slate <Editor> component is re-resolving `props.plugins` or `props.schema` on each update, which leads to poor performance. This is often due to passing in a new `schema` or `plugins` prop with each render by declaring them inline in your render function. Do not do this!'
    )

    if (this.tmp.change) {
      this.props.onChange(this.tmp.change)
    }
  }

  /**
   * Render the editor.
   *
   * @return {Element}
   */

  render() {
    debug('render', this)
    const { controller } = this
    const props = { ...this.props }
    const plugins = this.resolvePlugins(props.plugins, props.schema)
    const { value, readOnly, onChange } = props

    controller.setProperties({ plugins, value, readOnly, onChange })
    const element = controller.stack.render('renderEditor', props, controller)
    return element
  }

  /**
   * On change.
   *
   * @param {Change} change
   */

  onChange = change => {
    if (this.tmp.mounted) {
      this.props.onChange(change)
    } else {
      this.tmp.change = change
    }
  }

  /**
   * Resolve a set of plugins from potential `plugins` and a `schema`.
   *
   * In addition to the plugins provided in props, this will initialize three
   * other plugins:
   *
   * - The top-level editor plugin, which allows for top-level handlers, etc.
   * - The two "core" plugins, one before all the other and one after.
   *
   * @param {Array} plugins
   * @param {Schema|Object} schema
   * @return {Array}
   */

  resolvePlugins = (plugins, schema) => {
    this.tmp.resolves++

    const beforePlugin = BeforePlugin()
    const afterPlugin = AfterPlugin()
    const editorPlugin = { schema }

    for (const prop of PLUGINS_PROPS) {
      // Skip `onChange` because the editor's `onChange` is special.
      if (prop === 'onChange') continue

      // Skip `schema` because it can't be proxied easily, so it must be passed
      // in as an argument to this function instead.
      if (prop === 'schema') continue

      // Define a function that will just proxies into `props`.
      editorPlugin[prop] = (...args) => {
        return this.props[prop] && this.props[prop](...args)
      }
    }

    return [beforePlugin, editorPlugin, ...plugins, afterPlugin]
  }
}

/**
 * Mix in the prop types for the event handlers.
 */

for (const prop of EVENT_HANDLERS) {
  Editor.propTypes[prop] = Types.func
}

/**
 * Export.
 *
 * @type {Component}
 */

export default Editor
