import React, { useEffect, useState } from 'react'
import bundler from '../bundler'
import { type Cell } from '../store'
import { useActions } from '../hooks/use-actions'
import CodeEditor from './code-editor'
import Preview from './preview'
import Resizable from './resizable'

interface CodeCellProps {
  cell: Cell
}

// We extracted the whole "input-text->bundle-transpile-code->execute-code"
// flow to a separate "CodeCell" component. We need this because we
// want to have as many code snippets on the screen as we want.
const CodeCell: React.FC<CodeCellProps> = ({ cell }) => {
  // Code - what is bundled-transpiled and ready to be executed:
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const { updateCell } = useActions()

  useEffect(() => {
    const timer = setTimeout(() => {
      bundler(cell.content)
        .then((result) => {
          // If the bundle-transpile process succeeds,
          // then we update "code" AND "error" state pieces
          // and pass these values via props to "Preview" component.
          setCode(result.code)
          setError(result.err)
          // Now when ESBUILD has bundled and transpiled code, there is another major question:
          // how are we going to execute the code user provided?
          // The straightforward way of doing this is using EVAL:
          // eval(result.outputFiles[0].text)
          // BUT:
          // 1) User-provided code might throw errors and cause app to crash.
          // 2) User-provided code might mutate the DOM, causing our app to crash.
          // 3) User might accidentally run code provided by malicious user etc.
          // So it looks like using EVAL like this is not what we want, and we have to
          // do some preparations first before we can really use it safely.
          // To solve this problem we can use IFRAME with correct settings("sandbox"
          // and/or "src" attributes) AND/OR serve HTML for the iframe from different domain/port
          // to disallow cross-frame access.
          // How will it address the issues mentioned before?
          // Well:
          // 1) JS error inside an iframe WILL NOT crash the app
          // because JS code inside an iframe has different execution context.
          // 2) DOM mutations inside an iframe can be applied ONLY to the "document"
          // that is inside this iframe (iframe must be correctly set up).
          // 3) Malicious code (input onChange event listeners for stealing creds,
          // accessing document.cookie etc.) can be applied ONLY to the "document"
          // that is inside this iframe (iframe must be correctly set up).

          // We've decided NOT to go with SERVING HTML for an IFRAME at the different domain/port for the
          // sake of (1)simplicity (we don't have to set up additional server infrastructure)
          // AND (2)performance (we don't have to make any requests to fetch some HTML for rendering it inside iframe).
          // What are the consequences of this choice?
          // User will have some LIMITATIONS to the code that they can write and execute inside our app:
          // 1) No localStorage access.
          // 2) No cookies access.
        })
        .catch((err) => {
          console.log(err)
        })
    }, 1000)

    return () => {
      clearTimeout(timer)
    }
  }, [cell.content])

  const onEditorChangeHandler = (value: string): void => {
    updateCell(cell.id, value)
  }

  return (
    // Here we wrap different blocks (code editor and preview window)
    // with "Resizable" component and specify the direction in which
    // we want resizing to be enabled:
    <Resizable direction="vertical">
      <div style={{ display: 'flex', height: '100%' }}>
        <Resizable direction="horizontal">
          <CodeEditor
            initialValue={cell.content}
            onChange={onEditorChangeHandler}
          />
        </Resizable>
        <Preview code={code} bundlingError={error} />
      </div>
    </Resizable>
  )
}

export default CodeCell
