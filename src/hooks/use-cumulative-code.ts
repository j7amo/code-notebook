import { useTypedSelector } from './use-typed-selector'

// We want to add another feature to our app:
// Current Code cell should have access to all previous code cell's code.
// So that user can e.g. define a function in Cell #1 and execute this function
// later in the Cell #10.
// To achieve this we just take all previous code cells + current cell contents
// and join them. And only after it, we create a bundle that will contain all the code
// from cells starting with Cell #1 and ending with Cell #10.
export const useCumulativeCode = (cellId: string): string => {
  return useTypedSelector((state) => {
    const { data, order } = state.cells
    const index = order.findIndex((id) => id === cellId)
    const truncatedCellsOrderList = order.slice(0, index + 1)
    const orderedCells = truncatedCellsOrderList.map((id) => data[id])
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
        if (item.id === cellId) {
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
}
