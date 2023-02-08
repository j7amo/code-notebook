import 'bulmaswatch/superhero/bulmaswatch.min.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
// import CodeCell from './components/code-cell'
import TextEditor from './components/text-editor'

const App: React.FC = () => {
  // return <CodeCell />
  return (
    <div>
      <TextEditor />
    </div>
  )
}

const root = createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
