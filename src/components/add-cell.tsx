import './add-cell.css'
import React from 'react'
import { useActions } from '../hooks/use-actions'

interface AddCellProps {
  currentCellId: string | null
  // This property will indicate if we explicitly show the AddCell component
  // with full opacity(by default we are showing the component only on hover).
  // Why do we need this? Because when all cells are removed from the screen
  // there's really no guidance for the user on what to do next!
  forceVisible?: boolean
}

const AddCell: React.FC<AddCellProps> = ({ currentCellId, forceVisible }) => {
  const { insertCellAfter } = useActions()

  const onAddCodeCellClick = (): void => {
    insertCellAfter(currentCellId, 'code')
  }

  const onAddTextCellClick = (): void => {
    insertCellAfter(currentCellId, 'text')
  }

  return (
    <div className={`add-cell ${forceVisible === true ? 'force-visible' : ''}`}>
      <div className="add-buttons">
        <button
          className="button is-rounded is-primary is-small"
          onClick={onAddCodeCellClick}
          type="button"
        >
          <span className="icon is-small">
            <i className="fas fa-plus"></i>
          </span>
          <span>Code</span>
        </button>
        <button
          className="button is-rounded is-primary is-small"
          onClick={onAddTextCellClick}
          type="button"
        >
          <span className="icon is-small">
            <i className="fas fa-plus"></i>
          </span>
          <span>Text</span>
        </button>
      </div>
      <div className="divider"></div>
    </div>
  )
}

export default AddCell
