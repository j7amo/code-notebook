import React from 'react'
import { useTypedSelector } from '../hooks/use-typed-selector'
import CellListItem from './cell-list-item'

const CellList: React.FC = () => {
  // To get cells in the same order that is stored in "order" property we apply selector:
  const cellsList = useTypedSelector(({ cells: { data, order } }) =>
    order.map((id) => data[id])
  )

  const renderedCells = cellsList.map((cell) => (
    <CellListItem key={cell.id} cell={cell} />
  ))

  return <ul>{renderedCells}</ul>
}

export default CellList
