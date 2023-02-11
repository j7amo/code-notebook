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

    // Here we define a string representation of "show" function that user can use
    // to display any value inside Preview window. This function should correctly:
    // - print out primitive values;
    // - complex structures (e.g. arrays, objects);
    // - render React elements.
    // p.s. There can be names conflicts
    // e.g. we import React, ReactDOM behind the scenes and user also does
    // the same importing = conflict!
    // So we need to avoid this situtation by:
    // - renaming our "behind-the-scenes" imports;
    // - telling ESBUILD to use them instead.
    const show = `
      import _React from 'react';
      import _ReactDOM from 'react-dom';
    
      var show = (value) => {
        const root = document.getElementById('root');
        
        if (typeof value === 'object') {
          if (value.$$typeof && value.props) {
            _ReactDOM.render(value, root);
          } else {
            root.innerHTML = JSON.stringify(value);
          }
        } else {
          root.innerHTML = value;
        }
      };
    `

    // We also define a Non-Operational version(that does nothing) of the same function
    const showNoOp = 'var show = () => {};'

    return orderedCodeCells
      .map((item) => {
        // The current cell that is rendered inside CodeCell component
        // should get the WORKING version of "show" function so that user can
        // use it for Preview window to display something
        if (item.id === cell.id) {
          return show.concat(item.content)
        }
        // All previous cells should get the NON-OPERATING version of "show" function
        // so that ALL PREVIOUS CALLS to "show" would do nothing to the current Preview window.
        // Why do we need? Because without this distinction between "show" function implementation
        // between different cells, the current code cell Preview window will display:
        // - ALL "show" calls from previous cells(which we DON'T want!);
        // - AND "show" calls from the current cell.
        return showNoOp.concat(item.content)
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
