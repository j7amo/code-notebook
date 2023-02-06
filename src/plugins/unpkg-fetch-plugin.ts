import type * as esbuild from 'esbuild-wasm'
import axios from 'axios'
import * as localforage from 'localforage'

// We create a "localforage" instance which is an abstraction over IndexedDB
// (which is built in the browser), that helps us use it in a comfortable way:
const fileCache = localforage.createInstance({
  name: 'fileCache'
})

export const unpkgFetchPlugin = (inputCode: string): esbuild.Plugin => {
  return {
    name: 'unpkg-fetch-plugin',
    setup (build: esbuild.PluginBuild) {
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
