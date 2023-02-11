import React, { useEffect } from 'react'
import { type Cell } from '../store'
import { useActions } from '../hooks/use-actions'
import { useTypedSelector } from '../hooks/use-typed-selector'
import { useCumulativeCode } from '../hooks/use-cumulative-code'
import CodeEditor from './code-editor'
import Resizable from './resizable'
import Preview from './preview'
import './code-cell.css'

interface CodeCellProps {
  cell: Cell
}

// We extracted the whole "input-text->bundle-transpile-code->execute-code"
// flow to a separate "CodeCell" component. We need this because we
// want to have as many code snippets on the screen as we want.
const CodeCell: React.FC<CodeCellProps> = ({ cell }) => {
  // Bundle - what is bundled-transpiled and ready to be executed.
  const bundle = useTypedSelector((state) => state.bundles[cell.id])
  const cumulativeCode = useCumulativeCode(cell.id)

  const { updateCell, createBundle } = useActions()

  useEffect(() => {
    if (bundle == null) {
      createBundle(cell.id, cumulativeCode)
      return
    }

    const timer = setTimeout(() => {
      createBundle(cell.id, cumulativeCode)
    }, 1000)

    return () => {
      clearTimeout(timer)
    }
  }, [cumulativeCode, cell.id, createBundle])

  const onEditorChangeHandler = (value: string): void => {
    updateCell(cell.id, value)
  }

  return (
    // Here we wrap different blocks (code editor and preview window)
    // with "Resizable" component and specify the direction in which
    // we want resizing to be enabled:
    <Resizable direction="vertical">
      <div style={{ display: 'flex', height: 'calc(100% - 10px)' }}>
        <Resizable direction="horizontal">
          <CodeEditor
            initialValue={cell.content}
            onChange={onEditorChangeHandler}
          />
        </Resizable>
        <div className="progress-wrapper">
          {bundle == null || bundle.processing
            ? (
            <div className="progress-cover">
              <progress className="progress is-small is-primary" max="100">
                Loading...
              </progress>
            </div>
              )
            : (
            <Preview code={bundle.code} bundlingError={bundle.error} />
              )}
        </div>
      </div>
    </Resizable>
  )
}

export default CodeCell
