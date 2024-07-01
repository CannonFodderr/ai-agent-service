import { Response } from "express";
import createLogger from "fodderlogger/dist";
import { Stream } from "stream";
const debugMode = true
const logger = createLogger('stream.utils', { debug: debugMode })

export async function bufferStreamHandler (stream: Stream, res: Response): Promise<boolean> {
    return new Promise((resolve, reject) => {
        let debugAnswer = '\n'
        stream.on('data', (buffer: Buffer) => {
            try {
                
                const streamEvent = JSON.parse(buffer.toString().trim())
                const status = streamEvent.done ? 200 : 207
                if(streamEvent.response) {
                    if(debugMode) {
                        debugAnswer += streamEvent.response
                    }    
                    res.status(status).write(streamEvent.response)
                }
            } catch (error) {
                logger.error(`Error parsing stream: ${error}`)
                resolve(false)
            }
        })
        stream.on("end", () => {
            logger.info('Stream ended')
            if(debugMode) {
                logger.debug(debugAnswer)
            }
            resolve(true)
        })
        stream.on("error", (err) => {
            logger.error(`Error in stream: ${err}`)
            reject("LLM stream error")
        })
    })
}
export async function bufferStreamToString (stream: Stream): Promise<string | null> {
    return new Promise((resolve, reject) => {
        let answer = ""
        stream.on('data', (buffer: Buffer) => {
            try {
                
                const streamEvent = JSON.parse(buffer.toString().trim())
                const status = streamEvent.done ? 200 : 207
                if(streamEvent.response) {
                    answer += streamEvent.response
                }
            } catch (error) {
                logger.error(`Error parsing stream: ${error}`)
                resolve(null)
            }
        })
        stream.on("end", () => {
            logger.debug('Stream ended')
            resolve(answer)
        })
        stream.on("error", (err) => {
            logger.error(`Error in stream: ${err}`)
            reject("LLM stream error")
        })
    })
}