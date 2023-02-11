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
      // Here we are basically hijacking/overriding/intercepting the way that ESBUILD naturally
      // loads the files(it reads them from the filesystem)!
      // We don't want ESBUILD to try and load "index.ts" file from the hard-drive,
      // but instead we return file content right away (we are currently mocking the file content)
      build.onLoad(
        { filter: /(^index\.js$)/ },
        async (args: esbuild.OnLoadArgs) => {
          // We return an object that contains file contents for ESBUILD to use it
          return {
            loader: 'jsx',
            // The value of "contents" field should be the one that the user of our app
            // entered in the text input:
            contents: inputCode
          }
        }
      )

      // We extract duplicating logic into a separate "onLoad" handler.
      // It turns out that it is not mandatory to return from it.
      // If nothing is returned then ESBUILD will just go to the next "onLoad" handler.
      // But if we return something then ESBUILD will be satisfied by this handler
      // and won't go to other ones.
      build.onLoad({ filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
        // We need to check if we already fetched the package and if it is in the cache.
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
          args.path
        )

        if (cachedResult != null) {
          // If YES then we return it
          // and no other "onLoad" handler will fire after this one:
          return cachedResult
        }
      })

      build.onLoad({ filter: /.css$/ }, async (args: esbuild.OnLoadArgs) => {
        const { data, request } = await axios.get(args.path)

        // In order to make our in-browser bundler work with CSS files
        // we need to apply some HACK. Why should we do it? ESBUILD can bundle CSS
        // files as well, BUT... it turns out that ESBUILD will gather all CSS files
        // referenced from a given entry point and bundle it into a sibling CSS output file
        // next to the JavaScript output file for that JavaScript entry point.
        // So if ESBUILD generates app.js it would also generate app.css containing all CSS files
        // referenced by app.js. But we HAVE NO FILESYSTEM IN THE BROWSER! So we need to somehow trick
        // ESBUILD. That's why we inject CSS contents(that we download from UNPKG) directly
        // inside HTML document here.
        // Before we start injecting CSS into the document,
        // we need to remove some symbols or app is going to crash:
        const escapedCSS = data
          // remove new line characters
          .replace(/\n/g, '')
          // escape double quotes
          .replace(/"/g, '\\"')
          // escape single quotes
          .replace(/'/g, '\\\'')

        const contents = `
            const style = document.createElement('style');
            style.innerText = '${escapedCSS as string}';
            document.head.appendChild(style);
          `

        const requestResult: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents,
          resolveDir: new URL('./', request.responseURL).pathname
        }

        await fileCache.setItem(args.path, requestResult)

        return requestResult
      })

      build.onLoad({ filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
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
