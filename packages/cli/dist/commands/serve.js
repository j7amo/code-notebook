"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveCommand = void 0;
const path_1 = __importDefault(require("path"));
const commander_1 = require("commander");
const local_api_1 = require("local-api");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isLocalApiError = (err) => {
    return typeof err.code === 'string';
};
// We want to use PROXY ONLY IN DEVELOPMENT. So we'll use this flag
// to make this decision and pass it as a 4th argument to "serve" command.
// Later we will use a script that will find "process.env.NODE_ENV" inside raw js file
// and replace it with "production"
// "process.env.NODE_ENV === 'production'" -> "'production' === 'production'"
// Which will result in user always running our app
// in production mode("isProduction" will be true).
const isProduction = process.env.NODE_ENV === 'production';
// Define a command for CLI
exports.serveCommand = new commander_1.Command()
    // Square brackets indicate that the parameter inside is OPTIONAL
    .command('serve [filename]')
    .description('Open a file for editing')
    // Angle brackets indicate that the parameter inside is REQUIRED
    .option('-p, --port <number>', 'Port to run server on', '4005')
    // Callback for the command
    .action((filename = 'notebook.js', options) => __awaiter(void 0, void 0, void 0, function* () {
    // We set up error handling logic inside the CLI so that it will be a single point for this process.
    // Why do we place it here? Because currently we only have "local-api" package being used
    // by the CLI. But in the future it is possible that we will have
    // more packages(e.g "public-api" etc.) and those packages might as well be developed
    // by different engineers. And if every engineer starts implementing his own error handling logic
    // inside those packages it will be INCONSISTENT!
    try {
        // Let's say that user opens up the terminal window at path "~/workspace/notes".
        // Then he types "js-book serve js-notes/notebook.js" to start the app.
        // In this case we can use several NodeJS functions to get all these values:
        // - "process.cwd()" results in "~/workspace/notes";
        // - "path.dirname(filename))" results in "js-notes";
        // - "path.basename(filename)" results in "notebook.js".
        const dir = path_1.default.join(process.cwd(), path_1.default.dirname(filename));
        // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression,@typescript-eslint/await-thenable
        yield (0, local_api_1.serve)(parseInt(options.port), path_1.default.basename(filename), dir, !isProduction);
        console.log(`Opened ${filename}. Navigate to http://localhost:${options.port} to edit the file`);
    }
    catch (err) {
        if (isLocalApiError(err)) {
            if (err.code === 'EADDRINUSE') {
                console.log('Port is already in use. Please try running the app on another port.');
            }
        }
        else if (err instanceof Error) {
            console.log('Here is the problem', err.message);
        }
        // Force exit the program if something went wrong
        process.exit(1);
    }
}));
