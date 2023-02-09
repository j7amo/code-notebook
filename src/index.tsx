import 'bulmaswatch/superhero/bulmaswatch.min.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import TextEditor from './components/text-editor'
import { store } from './store'

const App: React.FC = () => {
  // return <CodeCell />
  return (
    <Provider store={store}>
      <div>
        <TextEditor />
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
