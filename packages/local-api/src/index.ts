import * as path from 'path'
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { createCellsRouter } from './routes/cells'

// We define a function that takes the following arguments:
// - port (to run server on);
// - filename (file on the hard drive to load/save cells from/to);
// - dir (file directory).
// Later we will use this function in CLI package. So when user types a command
// via CLI -> this function will be called and server started!
// eslint-disable-next-line @typescript-eslint/promise-function-async
export const serve = (
  port: number,
  filename: string,
  dir: string,
  useProxy: boolean
): Promise<void> => {
  const app = express()
  // We enable routing for cells read/write operations by using a corresponding router:
  app.use('/', createCellsRouter(filename, dir))

  // Are we actively developing our app on our local machine?
  // Then use proxy to local CRA dev server
  if (useProxy) {
    // We use proxy middleware for Express to automatically
    // re-route specific requests FROM local-api TO our running CRA
    app.use(
      createProxyMiddleware({
        // URL to proxy (Create react App hosting server address)
        target: 'http://localhost:3000',
        // Enable Websocket support (because Create React App uses WS for dev purposes)
        ws: true,
        // We don't want this middleware to log
        logLevel: 'silent'
      })
    )
    // Are we running our app on a user's machine?
    // Then serve static built files from build directory
  } else {
    // We could've just used a naive approach of simply telling our "local-api"
    // package to serve static resources with Express Static middleware from the
    // other package's(which is "js-book-client") "build" directory, but there's a problem:
    // This just WON'T WORK on user machine because when we publish all 3 packages
    // to NPM Registry, they all will be standalone archives and after extracting them,
    // folders' structure will be different and the path won't work!
    // app.use(express.static('../../js-book-client/build'))

    // But if we add "js-book-client" package as a dependency to "local-api" package,
    // then INSIDE NODE_MODULES we'll have access to ALL the files
    // inside "js-book-client" package and can reference them.
    // But this solution is not as straightforward as it may seem.
    // Simply changing the path like this WON'T work:
    // app.use(express.static('../node_modules/js-book-client/build'))
    // Why? Because in Lerna projects such links are SYMBOLIC links,
    // and they do not work correctly with Express Static Middleware.

    // So we need to take symbolic link and resolve it to an absolute path so that
    // Express Middleware is happy.
    // To do it we need to use "require.resolve" to look up the location of a Node module,
    // without loading the module itself(i.e. just return the resolved filename):
    const packagePath = require.resolve('js-book-client/build/index.html')
    // We don't need "index.html" directly, but we need to use it
    // to correctly resolve a path inside NODE_MODULES. After that we just basically
    // truncate "index.html" part from the path(we don't want the entire path)
    // and that's it:
    app.use(express.static(path.dirname(packagePath)))
  }

  return new Promise<void>((resolve, reject) => {
    app.listen(port, resolve).on('error', reject)
  })
}
