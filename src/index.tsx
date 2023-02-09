import 'bulmaswatch/superhero/bulmaswatch.min.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import CellList from './components/cell-list'

const App: React.FC = () => {
  // return <CodeCell />
  return (
    <Provider store={store}>
      <div>
        <CellList />
      </div>
    </Provider>
  )
}

const root = createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
