import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as esbuild from 'esbuild-wasm'
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin'
import { unpkgFetchPlugin } from './plugins/unpkg-fetch-plugin'

const App: React.FC = () => {
  // This ref is for (1)storing AND (2)persisting
  // the ESBUILD service reference between renders:
  const ref = useRef<esbuild.Service>()
  const [text, setText] = useState('')
  const [code, setCode] = useState('')

  // Here we start the ESBUILD service to use it later for:
  // - transpiling
  // - bundling
  const startService = async (): Promise<void> => {
    // We want to make this ESBUILD service available throughout
    // component, so we create a ref and store the reference
    // to the service in it:
    ref.current = await esbuild.startService({
      // By default, esbuild runs the WebAssembly-based browser API
      // in a web worker to avoid blocking the UI thread.
      // This can be disabled by setting “worker” to false.
      worker: true, // <- this is not needed, it's here for educational purpose
      // The URL of the “esbuild.wasm” file.
      // This must be provided when running esbuild in the browser.
      // p.s. At first, we took this file from the "/node_modules/esbuild-wasm" folder
      // and placed it inside "public" folder so that we can reference it when running the app.
      // Why?
      // If you put a file into the public folder, it will not be processed by webpack.
      // Instead, it will be copied into the build folder COMPLETELY UNTOUCHED (which is what we need)
      // which means:
      // - it is not post-processed or minified;
      // - filename won’t include content hash.
      // BUT later we decided to remove this workaround and simply provide a link to
      // this file hosted on the UNPKG service:
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm'
    })
  }

  const onChangeHandler = (
    evt: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    setText(evt.target.value)
  }

  const onSubmitHandler = (): void => {
    // We must make sure that we are not trying to call
    // ESBUILD service methods before it is initialized:
    if (ref.current == null) {
      return
    }

    // We start transpiling-bundling process by calling "build" method
    // of the ESBUILD service and passing "options" object to it:
    ref.current
      .build({
        // When we bundle the code with ESBUILD, we DON'T PROVIDE THE CODE!
        // Instead, we define the file where ESBUILD should start:
        entryPoints: ['index.js'],
        // Define if ESBUILD should also bundle the code (not only transpile it)
        bundle: true,
        write: false,
        // Define what plugins will be used in the process
        plugins: [unpkgPathPlugin(), unpkgFetchPlugin(text)],
        // Define things that will be replaced in the process:
        define: {
          // When ESBUILD finds a "process.env.NODE_ENV" inside the code,
          // it will replace it with "production" (which in turn will result in a part
          // of code removed from the final transpiled code which is great!)
          'process.env.NODE_ENV': '"production"',
          // When ESBUILD finds a variable "global" inside the code
          // it transpiles, it will replace it with "window" (keep in mind that
          // browser doesn't know anything about "global" variable!)
          global: 'window'
        }
      })
      .then((result) => {
        // If the transpile-build process succeeds,
        // then we set the "code" value in the state slice
        setCode(result.outputFiles[0].text)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  useEffect(() => {
    // We start ESBUILD as a long-lived child process that is then reused,
    // so we can call methods on the service many times without the overhead
    // of starting up a new child process each time. So we need to do it only once
    // when we mount the component, so "useEffect" is a good place for this functionality:
    void startService()
  }, [])

  return (
    <div>
      <textarea value={text} onChange={onChangeHandler}></textarea>
      <div>
        <button onClick={onSubmitHandler} type="button">
          Submit
        </button>
      </div>
      <pre>{code}</pre>
    </div>
  )
}

const root = createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
