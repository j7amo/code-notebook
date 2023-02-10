import React, { useEffect, useRef } from 'react'
import './preview.css'

interface PreviewProps {
  code: string
  bundlingError: string
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

// This HTML is rendered inside an iframe via "srcDoc" attribute.
// We are referencing "window" object of the iframe (every iframe has its own
// window and document objects) and listening for a "message" event that we post/send
// after ESBUILD finished its work. When such an event occurs we handle it by
// (1)extracting the "data" property(which is going to be a string)
// from the "event" object itself AND (2)calling the EVAL with this string.
// This way we can now avoid "srcDoc"-ONLY approach's limitations
// and transfer as much code as we want.
// Also, we set up error handling inside this code:
// 1) Generally we handle errors with the help of "handleError" function
// that (1)renders error in the preview window and (2)also prints it
// to the browser console.
// 2) To catch SYNCHRONOUS RUNTIME errors we (1)listen for "message"
// event on the window object, (2)get the "data" field from the "event",
// (3)try to run execute it via "eval" inside try-catch block and (4)call
// "handleError" inside catch block if there's such an error.
// 3) To catch ASYNCHRONOUS RUNTIME errors we (1)listen for "error"
// event on the window object, (2)call "preventDefault" method on "event"
// to prevent default browser behaviour(which is printing error to the browser
// console which we already do with the help of our own function and don't want
// to duplicate), (3)call "handleError".

const html = `
  <html style='background-color: white'>
    <head></head>
    <body>
      <div id='root'></div>
        <script>
        const handleError = (err) => {
          const root = document.getElementById('root');
          root.innerHTML = '<div style="color: red;"><h4>Runtime Error</h4>' + err + '</div>';
          console.error(err);
        }
          window.addEventListener('error', (event) => {
            event.preventDefault();
            handleError(event.error);
          })
        
          window.addEventListener('message', (event) => {
            try {
              eval(event.data);
            } catch (err) {
              handleError(err);
            }
          }, false)
        </script>
    </body>
  </html>
`

const Preview: React.FC<PreviewProps> = ({ code, bundlingError }) => {
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
      // We give iframe some time to reset html contents
      // before we post a message with the code we want to execute.
      // Why do we need this? Because without this small hack we are
      // posting a message to an "old" iframe content AND
      // then reset it with the template, and that's not what we want!
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(code, '*')
      }, 100)
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
      {bundlingError != null && (
        <div className="preview-error">{bundlingError}</div>
      )}
    </div>
  )
}

export default Preview
