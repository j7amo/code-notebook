"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveCommand = void 0;
const commander_1 = require("commander");
// Define a command for CLI
exports.serveCommand = new commander_1.Command()
    // Square brackets indicate that the parameter inside is OPTIONAL
    .command('serve [filename]')
    .description('Open a file for editing')
    // Angle brackets indicate that the parameter inside is REQUIRED
    .option('-p, --port <number>', 'Port to run server on', '4005')
    // Callback for the command
    .action((filename = 'notebook.js', options) => {
    console.log(filename);
    console.log(options);
});
