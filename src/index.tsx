import 'bulmaswatch/superhero/bulmaswatch.min.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import CodeCell from './components/code-cell'

const App: React.FC = () => {
  return <CodeCell />
}

const root = createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
