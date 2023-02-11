import React, { useEffect } from 'react'
import { type Cell } from '../store'
import { useActions } from '../hooks/use-actions'
import { useTypedSelector } from '../hooks/use-typed-selector'
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
  // We want to add another feature to our app:
  // Current Code cell should have access to all previous code cell's code.
  // So that user can e.g. define a function in Cell #1 and execute this function
  // later in the Cell #10.
  // To achieve this we just take all previous code cells + current cell contents
  // and join them. And only after it, we create a bundle that will contain all the code
  // from cells starting with Cell #1 and ending with Cell #10.
  const cumulativeCode = useTypedSelector((state) => {
    const { data, order } = state.cells
    const index = order.findIndex((cellId) => cellId === cell.id)
    const truncatedCellsOrderList = order.slice(0, index + 1)
    const orderedCells = truncatedCellsOrderList.map((cellId) => data[cellId])
    const orderedCodeCells = orderedCells.filter((item) => item.type === 'code')

    return orderedCodeCells
      .map((item) => {
        return item.content
      })
      .join('\n')
  })

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
