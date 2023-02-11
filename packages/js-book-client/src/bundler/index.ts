import * as esbuild from 'esbuild-wasm'
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin'
import { unpkgFetchPlugin } from './plugins/unpkg-fetch-plugin'

interface BundlerResult {
  code: string
  err: string
}

let service: esbuild.Service
// Here we start the ESBUILD service to use it later for:
// - transpiling
// - bundling
const bundler = async (rawCode: string): Promise<BundlerResult> => {
  if (service == null) {
    service = await esbuild.startService({
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

  try {
    // We start transpiling-bundling process by calling "build" method
    // of the ESBUILD service and passing "options" object to it:
    const result = await service.build({
      // When we bundle the code with ESBUILD, we DON'T PROVIDE THE CODE!
      // Instead, we define the file where ESBUILD should start:
      entryPoints: ['index.ts'],
      // Define if ESBUILD should also bundle the code (not only transpile it)
      bundle: true,
      write: false,
      // Define what plugins will be used in the process
      plugins: [unpkgPathPlugin(), unpkgFetchPlugin(rawCode)],
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
      },
      // We tell ESBUILD to use "_React"(our own custom "behind-the-scenes" import)
      // instead of "React" (user imported)
      jsxFactory: '_React.createElement',
      jsxFragment: '_React.Fragment'
    })

    return {
      code: result.outputFiles[0].text,
      err: ''
    }
  } catch (err) {
    if (err instanceof Error) {
      // If this is some regular error then we return an object
      // that can be used later e.g. for rendering the error message
      // in preview window and printing it in the browser console
      return {
        code: '',
        err: err.message
      }
    } else {
      // If this is some unknown error, then we re-throw it
      throw err
    }
  }
}

export default bundler
