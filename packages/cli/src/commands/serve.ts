import path from 'path'
import { Command } from 'commander'
import { serve } from 'local-api'

interface LocalApiError {
  code: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isLocalApiError = (err: any): err is LocalApiError => {
  return typeof err.code === 'string'
}

// Define a command for CLI
export const serveCommand = new Command()
  // Square brackets indicate that the parameter inside is OPTIONAL
  .command('serve [filename]')
  .description('Open a file for editing')
  // Angle brackets indicate that the parameter inside is REQUIRED
  .option('-p, --port <number>', 'Port to run server on', '4005')
  // Callback for the command
  .action(async (filename = 'notebook.js', options: { port: string }) => {
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
      const dir = path.join(process.cwd(), path.dirname(filename))
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression,@typescript-eslint/await-thenable
      await serve(parseInt(options.port), path.basename(filename), dir)
      console.log(
        `Opened ${filename as string}. Navigate to http://localhost:${
          options.port
        } to edit the file`
      )
    } catch (err) {
      if (isLocalApiError(err)) {
        if (err.code === 'EADDRINUSE') {
          console.log(
            'Port is already in use. Please try running the app on another port.'
          )
        }
      } else if (err instanceof Error) {
        console.log('Here is the problem', err.message)
      }

      // Force exit the program if something went wrong
      process.exit(1)
    }
  })
