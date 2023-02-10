import React from 'react'
import { type Cell } from '../store'
import CodeCell from './code-cell'
import TextEditor from './text-editor'

interface CellListItemProps {
  cell: Cell
}

const CellListItem: React.FC<CellListItemProps> = ({ cell }) => {
  if (cell.type === 'code') {
    return <CodeCell cell={cell} />
  }

  return <TextEditor cell={cell} />
}

export default CellListItem
