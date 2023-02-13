/* eslint-disable @typescript-eslint/no-misused-promises */
// We are importing "fs" from "fs/promises" NOT from just "fs".
// Because we want to be able to write async code with Promises(which is not
// the case with "fs" that uses just callbacks)
import * as fs from 'fs/promises'
import * as path from 'path'
import express, { type Router } from 'express'

interface Cell {
  id: string
  content: string
  type: 'text' | 'code'
}

interface LocalApiError {
  code: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isLocalApiError = (err: any): err is LocalApiError => {
  return typeof err.code === 'string'
}

// We have to wrap all the router stuff with a function
// because we need filename and directory of the file for the read/write operations.
export const createCellsRouter = (filename: string, dir: string): Router => {
  const router = express.Router()
  router.use(express.json())

  const fullPath = path.join(dir, filename)

  router.get('/cells', async (req, res) => {
    try {
      // Try to read the file
      const result = await fs.readFile(fullPath, 'utf-8')

      res.send(JSON.parse(result))
    } catch (err) {
      // If read operation throws an error - we inspect it
      if (isLocalApiError(err)) {
        // This error is thrown when file does not exist
        if (err.code === 'ENOENT') {
          // We create a file and add some default cells array so that user can work with this file
          await fs.writeFile(fullPath, '[]', 'utf-8')

          // We also send back the empty array to the frontend app
          res.send([])
        }
      } else {
        throw err
      }
    }
  })

  router.post('/cells', async (req, res) => {
    // Take the list of cells from the request object(we expect the FE app to send it)
    const { cells }: { cells: Cell[] } = req.body

    // Serialize the list and write it to the file
    await fs.writeFile(fullPath, JSON.stringify(cells), 'utf-8')

    res.send({ status: 'ok' })
  })

  return router
}
