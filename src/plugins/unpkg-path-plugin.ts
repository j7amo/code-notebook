import type * as esbuild from 'esbuild-wasm'
import axios from 'axios'
import * as localforage from 'localforage'

// We create a "localforage" instance which is an abstraction over IndexedDB
// (which is built in the browser), that helps us use it in a comfortable way:
const fileCache = localforage.createInstance({
  name: 'fileCache'
})

// This is a CUSTOM PLUGIN for ESBUILD.
// Why do we need it?
// Because we want to change the way ESBUILD works. By default,
// ESBUILD works with files on the hard drive. And this is not
// what we want! We are not going to store all dependencies that app user uses
// in his code snippet on the hard drive. The user is going to request these dependencies
// on-the-fly from the UNPKG service(which is basically a CDN for all NPM packages)
// and the source code will be stored in browser memory.
export const unpkgPathPlugin = (inputCode: string): esbuild.Plugin => {
  // To write a plugin for ESBUILD we need to take several steps:
  // 1) Return an object with 2 properties:
  // - name;
  // - setup.
  return {
    // This name will be printed out by esbuild during its use
    name: 'unpkg-path-plugin',
    // The "setup" method will be called automatically by ESBUILD service.
    // The only argument to this method is a "build" argument that represents
    // the WHOLE BUILD PROCESS:
    // 1) Find files.
    // 2) Load files.
    // 3) Parse files.
    // 4) Repeat steps 1-3 for every "import/require/exports" found inside the files.
    // 5) Transpile files.
    // 6) Bundle (join) files together.
    setup (build: esbuild.PluginBuild) {
      // We can interact AND intervene with the BUILD process via event listeners to change
      // what is going on during these steps!
      // "onResolve" is a handler that is triggered when ESBUILD starts resolving the file path
      // for a given file, and we intercept it and do our thing.
      // Notice the first argument is an object with a "filter" property. We need it because
      // we want to resolve different filenames/filetypes differently!
      build.onResolve({ filter: /(^index\.js$)/ }, () => {
        // We return an object that will be used on "onLoad" step later
        // This object has properties:
        // - "path";
        // - "namespace" - this creates a namespace (sort of set) that can help later
        // when e.g. we want to load files from namespace "a" differently from files
        // from namespace "b" for some reason.
        return {
          path: 'index.js',
          namespace: 'a'
        }
      })

      // Here we resolve dependencies whose paths are relative to the path of the main module
      // that is requesting them. For this we need to construct the URL the special way.
      build.onResolve({ filter: /^\.+\// }, (args: esbuild.OnResolveArgs) => {
        return {
          namespace: 'a',
          path: new URL(args.path, `https://unpkg.com${args.resolveDir}/`).href
        }
      })

      build.onResolve({ filter: /.*/ }, async (args: esbuild.OnResolveArgs) => {
        return {
          namespace: 'a',
          // If a user writes something like "import React from 'react'" then
          // we just append the package (main module) name to UNPKG URL:
          path: `https://unpkg.com/${args.path}`
        }
      })

      // "onLoad" is a handler that is triggered when ESBUILD attempts to load the file by path
      build.onLoad({ filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
        // Here we are basically hijacking/overriding/intercepting the way that ESBUILD naturally
        // loads the files(it reads them from the filesystem)!
        // We don't want ESBUILD to try and load "index.js" file from the hard-drive,
        // but instead we return file content right away (we are currently mocking the file content)
        if (args.path === 'index.js') {
          // We return an object that contains file contents for ESBUILD to use it
          return {
            loader: 'jsx',
            // The value of "contents" field should be the one that the user of our app
            // entered in the text input:
            contents: inputCode
          }
        }

        // We need to check if we already fetched the package and if it is in the cache.
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
          args.path
        )

        if (cachedResult != null) {
          // If so then we return it:
          return cachedResult
        }
        // If there's nothing in the cache then we make a request
        // to UNPKG service to try and load package contents:
        const { data, request } = await axios.get(args.path)
        // If we successfully got the response from the UNPKG service,
        // then we need to:
        // 1) Construct an object compatible with ESBUILD:
        const requestResult: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents: data,
          // Here we construct a correct module resolution path. Why do we need to do it?
          // Because when we send the request to UNPKG service e.g. "GET https://unpkg.com/react",
          // in fact we will be most likely redirected several times and the final endpoint
          // can look like this: "https://unpkg.com/react@18.2.0/index.js" which is quite
          // different from what was initially sent. So to correctly resolve anything based on this
          // endpoint, we need to use the real endpoint value(the latter one).
          resolveDir: new URL('./', request.responseURL).pathname
        }
        // 2) Store the object in the cache:
        await fileCache.setItem(args.path, requestResult)

        return requestResult
      })
    }
  }
}
