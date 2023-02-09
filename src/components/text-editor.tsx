/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
import React, { useEffect, useRef, useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import './text-editor.css'

const TextEditor: React.FC = () => {
  // This piece of state is for tracking the current mode
  // and using it to render corresponding component.
  const [isEditMode, setIsEditMode] = useState(false)
  // We need this ref for tracking the on DIV click event.
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const listener = (evt: MouseEvent): void => {
      // When click event bubbles up, we want to check its target(source) property.
      // If the click was inside the div that is the container for text-editor,
      // then we don't want to exit edit-mode.
      if (
        ref.current != null &&
        evt.target != null &&
        // Here we check whether a node is a descendant of a given node,
        // i.e. the node itself, one of its direct children (childNodes),
        // one of the children's direct children, and so on.
        ref.current.contains(evt.target as Node)
      ) {
        return
      }

      // We exit edit-mode if the click was outside the text-editor
      setIsEditMode(false)
    }

    document.addEventListener('click', listener, { capture: true })

    return () => {
      document.removeEventListener('click', listener, { capture: true })
    }
  }, [])

  const onMarkdownClick = (): void => {
    setIsEditMode(true)
  }

  if (isEditMode) {
    return (
      // We are adding the className to be able to override default styling
      <div className="text-editor" ref={ref}>
        <MDEditor />
      </div>
    )
  }
  return (
    // We have to use "onClick" event handler on DIV
    // just because the component does not have it...
    <div className="text-editor" onClick={onMarkdownClick}>
      <MDEditor.Markdown source={'# Header'} />
    </div>
  )
}

export default TextEditor
