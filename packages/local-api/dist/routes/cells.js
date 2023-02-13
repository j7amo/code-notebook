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
exports.createCellsRouter = void 0;
/* eslint-disable @typescript-eslint/no-misused-promises */
// We are importing "fs" from "fs/promises" NOT from just "fs".
// Because we want to be able to write async code with Promises(which is not
// the case with "fs" that uses just callbacks)
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const express_1 = __importDefault(require("express"));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isLocalApiError = (err) => {
    return typeof err.code === 'string';
};
// We have to wrap all the router stuff with a function
// because we need filename and directory of the file for the read/write operations.
const createCellsRouter = (filename, dir) => {
    const router = express_1.default.Router();
    router.use(express_1.default.json());
    const fullPath = path.join(dir, filename);
    router.get('/cells', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Try to read the file
            const result = yield fs.readFile(fullPath, 'utf-8');
            res.send(JSON.parse(result));
        }
        catch (err) {
            // If read operation throws an error - we inspect it
            if (isLocalApiError(err)) {
                // This error is thrown when file does not exist
                if (err.code === 'ENOENT') {
                    // We create a file and add some default cells array so that user can work with this file
                    yield fs.writeFile(fullPath, '[]', 'utf-8');
                    // We also send back the empty array to the frontend app
                    res.send([]);
                }
            }
            else {
                throw err;
            }
        }
    }));
    router.post('/cells', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Take the list of cells from the request object(we expect the FE app to send it)
        const { cells } = req.body;
        // Serialize the list and write it to the file
        yield fs.writeFile(fullPath, JSON.stringify(cells), 'utf-8');
        res.send({ status: 'ok' });
    }));
    return router;
};
exports.createCellsRouter = createCellsRouter;
