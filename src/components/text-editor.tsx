/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
import React, { useEffect, useRef, useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import './text-editor.css'

const TextEditor: React.FC = () => {
  // We need this ref for tracking the on DIV click event.
  const ref = useRef<HTMLDivElement>(null)
  // This piece of state is for tracking the current mode
  // and using it to render corresponding component.
  const [isEditMode, setIsEditMode] = useState(false)
  // Thi piece of state is for storing the user input that was made inside the editor
  // so that we can show it also in preview version of our component
  const [editorInput, setEditorInput] = useState('# Header')

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

  const onEditorChange = (input: string | undefined): void => {
    // We have to use ternary operator here because input can be either "string"
    // or "undefined" and our piece of state expects "string" only
    setEditorInput(input != null ? input : '')
  }

  if (isEditMode) {
    return (
      // We are adding the className to be able to override default styling
      <div className="text-editor" ref={ref}>
        <MDEditor value={editorInput} onChange={onEditorChange} />
      </div>
    )
  }
  return (
    // We have to use "onClick" event handler on DIV
    // just because the component does not have it...
    <div className="text-editor card" onClick={onMarkdownClick}>
      <div className="card-content">
        <MDEditor.Markdown source={editorInput} />
      </div>
    </div>
  )
}

export default TextEditor
