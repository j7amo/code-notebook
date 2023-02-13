import { Command } from 'commander'
import { serve } from 'local-api'

// Define a command for CLI
export const serveCommand = new Command()
  // Square brackets indicate that the parameter inside is OPTIONAL
  .command('serve [filename]')
  .description('Open a file for editing')
  // Angle brackets indicate that the parameter inside is REQUIRED
  .option('-p, --port <number>', 'Port to run server on', '4005')
  // Callback for the command
  .action((filename = 'notebook.js', options: { port: string }) => {
    serve(parseInt(options.port), filename, '/')
  })
