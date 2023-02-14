import React, { useEffect } from 'react'
import { useTypedSelector } from '../hooks/use-typed-selector'
import { useActions } from '../hooks/use-actions'
import CellListItem from './cell-list-item'
import AddCell from './add-cell'
import './cell-list.css'

const CellList: React.FC = () => {
  // To get cells in the same order that is stored in "order" property we apply selector:
  const cellsList = useTypedSelector(({ cells: { data, order } }) =>
    order.map((id) => data[id])
  )
  const { fetchCells } = useActions()

  useEffect(() => {
    fetchCells()
  }, [fetchCells])

  const renderedCells = cellsList.map((cell) => (
    // We cannot just use a shorthand version of Fragment(i.e. <></>)
    // because we need to add a "key" prop. And this is possible only
    // if we explicitly say that it is a Fragment:
    <React.Fragment key={cell.id}>
      <CellListItem cell={cell} />
      <AddCell currentCellId={cell.id} />
    </React.Fragment>
  ))

  return (
    <div className="cell-list">
      <AddCell forceVisible={cellsList.length === 0} currentCellId={null} />
      {renderedCells}
    </div>
  )
}

export default CellList
