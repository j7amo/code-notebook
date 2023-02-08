import React, { useEffect, useRef } from 'react'
import './preview.css'

interface PreviewProps {
  code: string
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
  <html style='background-color: white'>
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

const Preview: React.FC<PreviewProps> = ({ code }) => {
  // We need this ref to be able to call a "postMessage"
  // on the iframe after bundling/transpiling of the code has finished:
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // While user is entering some code in the editor,we need to
    // RESET iframe content before putting this code into iframe and executing it.
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
      iframeRef.current.contentWindow?.postMessage(code, '*')
    }
  }, [code])

  return (
    // To isolate the contents of the iframe(i.e. prevent communication
    // between parent document and the document inside an iframe) we need to
    // make sure that:
    // 1) Iframe has a "sandbox" attribute.
    // 2) The value of this attribute IS NOT EQUAL to "ALLOW-SAME-ORIGIN".
    // So basically we can set the value to be anything else e.g. "allow-scripts"
    //  (to allow scripts execution)
    // To load HTML inside an iframe we can choose one of 3 major options:
    // 1) Use "src" attribute (e.g. 'src = "/test.html"') so when iframe loads
    // it will make a request to a resource specified inside the attribute.
    // 2) Use "srcDoc" attribute to INLINE the HTML that should be rendered AS IS(unescaped)
    // inside an iframe which can result in parsing errors(e.g. closing </script> tags
    // not being recognised correctly etc.)
    // Also keep in mind that (1)if browser support for this attribute
    // is absent then the browser will try to fall back to using "src" attribute instead
    // and (2)some browsers can possibly truncate the string that we pass into "srcDoc"
    // which will result in incorrect work of our app.
    // 3) Use "postMessage" method to send the code to all the listeners waiting for it.
    // Attach eventListener to an iframe, get the event and extract the code from the event data.
    <div className="preview-wrapper">
      <iframe
        title="code-execution-result"
        sandbox="allow-scripts"
        ref={iframeRef}
        srcDoc={html}
      />
    </div>
  )
}

export default Preview
