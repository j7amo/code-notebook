import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as esbuild from 'esbuild-wasm'
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin'
import { unpkgFetchPlugin } from './plugins/unpkg-fetch-plugin'

const App: React.FC = () => {
  // This ref is for (1)storing AND (2)persisting
  // the ESBUILD service reference between renders:
  const ref = useRef<esbuild.Service>()
  // We need this ref to be able to call a "postMessage"
  // on the iframe after bundling/transpiling of the code has finished:
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [text, setText] = useState('')

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
    // Just after the user clicked SUBMIT button,we need to
    // RESET iframe content.
    // Why? Because let's imagine one of possible scenarios:
    // 1) User enters "document.body.innerHTML = ''".
    // 2) Submits the code.
    // 3) Code is bundled and transpiled.
    // 4) Code is sent to iframe and injected into <script> tag.
    // 5) Code is executed and the <body> becomes empty (no <div id="root"> anymore).
    // 6) User decides that this is not what he wants and instead tries
    // to create a React component.
    // 7) The error occurs because ReactDOM cannot find a container to paste HTML into.
    // 8) User stops using our app.
    if (iframeRef.current != null) {
      iframeRef.current.srcdoc = html
    }

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
        // If the bundle-transpile process succeeds,
        // then we call "postMessage" method and send the resulting code to an iframe:
        if (iframeRef?.current != null) {
          iframeRef.current.contentWindow?.postMessage(
            result.outputFiles[0].text,
            '*'
          )
        }

        // Now when ESBUILD has bundled and transpiled code, there is another major question:
        // how are we going to execute the code user provided?
        // The straightforward way of doing this is using EVAL:
        // eval(result.outputFiles[0].text)
        // BUT:
        // 1) User-provided code might throw errors and cause app to crash.
        // 2) User-provided code might mutate the DOM, causing our app to crash.
        // 3) User might accidentally run code provided by malicious user etc.
        // So it looks like using EVAL like this is not what we want, and we have to
        // do some preparations first before we can really use it safely.
        // To solve this problem we can use IFRAME with correct settings("sandbox"
        // and/or "src" attributes) AND/OR serve HTML for the iframe from different domain/port
        // to disallow cross-frame access.
        // How will it address the issues mentioned before?
        // Well:
        // 1) JS error inside an iframe WILL NOT crash the app
        // because JS code inside an iframe has different execution context.
        // 2) DOM mutations inside an iframe can be applied ONLY to the "document"
        // that is inside this iframe (iframe must be correctly set up).
        // 3) Malicious code (input onChange event listeners for stealing creds,
        // accessing document.cookie etc.) can be applied ONLY to the "document"
        // that is inside this iframe (iframe must be correctly set up).

        // We've decided NOT to go with SERVING HTML for an IFRAME at the different domain/port for the
        // sake of (1)simplicity (we don't have to set up additional server infrastructure)
        // AND (2)performance (we don't have to make any requests to fetch some HTML for rendering it inside iframe).
        // What are the consequences of this choice?
        // User will have some LIMITATIONS to the code that they can write and execute inside our app:
        // 1) No localStorage access.
        // 2) No cookies access.
      })
      .catch((err) => {
        console.log(err)
      })
  }

  // This HTML is rendered inside an iframe via "srcDoc" attribute.
  // We are referencing "window" object of the iframe (every iframe has its own
  // window and document objects) and listening for a "message" event that we post/send
  // after ESBUILD finished its work. When such an event occurs we handle it by
  // (1)extracting the "data" property(which is going to be a string)
  // from the "event" object itself AND calling the EVAL with this string.
  // This way we can now avoid "srcDoc"-ONLY approach's limitations
  // and transfer as much code as we want.
  const html = `
    <html>
      <head></head>
      <body>
        <div id='root'></div>
          <script>
            window.addEventListener('message', (event) => {
              // Keep in mind that try-catch does not catch async errors
              try {
                eval(event.data)
              } catch (err) {
                const root = document.getElementById('root')
                root.innerHTML = '<div style="color: red;"><h4>Runtime Error</h4>' + err + '</div>'
                console.error(err)
              }
            }, false)
          </script>
      </body>
    </html>
  `

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
      {/* To isolate the contents of the iframe(i.e. prevent communication
       between parent document and the document inside an iframe) we need to
       make sure that:
       1) Iframe has a "sandbox" attribute.
       2) The value of this attribute IS NOT EQUAL to "ALLOW-SAME-ORIGIN".
       So basically we can set the value to be anything else e.g. "allow-scripts"
        (to allow scripts execution) */}
      {/* To load HTML inside an iframe we can choose one of 3 major options:
       1) Use "src" attribute (e.g. 'src = "/test.html"') so when iframe loads
       it will make a request to a resource specified inside the attribute.
       2) Use "srcDoc" attribute to INLINE the HTML that should be rendered AS IS(unescaped)
       inside an iframe which can result in parsing errors(e.g. closing </script> tags
       not being recognised correctly etc.)
       Also keep in mind that (1)if browser support for this attribute
       is absent then the browser will try to fall back to using "src" attribute instead
       and (2)some browsers can possibly truncate the string that we pass into "srcDoc"
       which will result in incorrect work of our app.
       3) Use "postMessage" method to send the code to all the listeners waiting for it.
       Attach eventListener to an iframe, get the event and extract the code from the event data. */}
      <iframe
        title="code-execution-result"
        sandbox="allow-scripts"
        ref={iframeRef}
        srcDoc={html}
      />
    </div>
  )
}

const root = createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
