"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serve = void 0;
const path = __importStar(require("path"));
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const cells_1 = require("./routes/cells");
// We define a function that takes the following arguments:
// - port (to run server on);
// - filename (file on the hard drive to load/save cells from/to);
// - dir (file directory).
// Later we will use this function in CLI package. So when user types a command
// via CLI -> this function will be called and server started!
// eslint-disable-next-line @typescript-eslint/promise-function-async
const serve = (port, filename, dir, useProxy) => {
    const app = (0, express_1.default)();
    // Are we actively developing our app on our local machine?
    // Then use proxy to local CRA dev server
    if (useProxy) {
        // We use proxy middleware for Express to automatically
        // re-route specific requests FROM local-api TO our running CRA
        app.use((0, http_proxy_middleware_1.createProxyMiddleware)({
            // URL to proxy (Create react App hosting server address)
            target: 'http://localhost:3000',
            // Enable Websocket support (because Create React App uses WS for dev purposes)
            ws: true,
            // We don't want this middleware to log
            logLevel: 'silent'
        }));
        // Are we running our app on a user's machine?
        // Then serve static built files from build directory
    }
    else {
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
        const packagePath = require.resolve('js-book-client/build/index.html');
        // We don't need "index.html" directly, but we need to use it
        // to correctly resolve a path inside NODE_MODULES. After that we just basically
        // truncate "index.html" part from the path(we don't want the entire path)
        // and that's it:
        app.use(express_1.default.static(path.dirname(packagePath)));
    }
    // We enable routing for cells read/write operations by using a corresponding router:
    app.use((0, cells_1.createCellsRouter)(filename, dir));
    return new Promise((resolve, reject) => {
        app.listen(port, resolve).on('error', reject);
    });
};
exports.serve = serve;
