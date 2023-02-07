import './code-editor.css'
import Editor, { type EditorDidMount } from '@monaco-editor/react'
import React, { useRef } from 'react'
import prettier from 'prettier'
import parser from 'prettier/parser-babel'

interface CodeEditorProps {
  initialValue: string
  onChange: (value: string) => void
}

const CodeEditor: React.FC<CodeEditorProps> = ({ initialValue, onChange }) => {
  // Define ref for storing the Editor instance
  const editorRef = useRef<any>()
  // Here we define the function that will be called when "Editor" is mounted:
  const onEditorDidMount: EditorDidMount = (getValue, editor): void => {
    // We set the value of the ref here to be able to
    // access the editor instance from outside the current function
    editorRef.current = editor
    // And this is basically an "onChange" substitute:
    editor.onDidChangeModelContent(() => {
      onChange(getValue())
    })

    // We can also change editor options here:
    editor.getModel()?.updateOptions({ tabSize: 2 })
  }

  const onFormatClick = (): void => {
    // Get current value from the editor
    const unformatted = editorRef.current?.getModel()?.getValue()
    if (unformatted != null) {
      // Format the value
      const formatted = prettier
        .format(unformatted, {
          parser: 'babel',
          plugins: [parser],
          useTabs: false,
          semi: true,
          singleQuote: true
        })
        .replace(/\n$/, '')
      // Set the formatted value back in the editor
      editorRef.current?.setValue(formatted)
    }
  }

  // Editor is a wrapper for "Monaco Editor"
  return (
    <div className="editor-wrapper">
      <button
        className="button button-format is-primary is-small"
        type="button"
        onClick={onFormatClick}
      >
        Format
      </button>
      <Editor
        // Monaco editor DOES NOT HAVE "onChange" prop.
        // We can use "editorDidMount" prop as a workaround.
        // This prop accepts a function that in turn accepts 2 arguments:
        // 1) A function that returns the current value of the code entered in editor.
        // 2) Editor instance that has "onDidChangeModelContent" event listener.
        // The combination of these 2 arguments is basically an "onChange" handler we need!
        editorDidMount={onEditorDidMount}
        value={initialValue}
        height="300px"
        language="javascript"
        theme="dark"
        options={{
          minimap: {
            enabled: false
          },
          wordWrap: 'on',
          showUnused: false,
          folding: false,
          lineNumbersMinChars: 3,
          fontSize: 16,
          scrollBeyondLastLine: false,
          automaticLayout: true
        }}
      />
    </div>
  )
}

export default CodeEditor
