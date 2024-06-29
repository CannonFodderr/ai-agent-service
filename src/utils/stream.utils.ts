import { Response } from "express";
import createLogger from "fodderlogger/dist";
import { Stream } from "stream";

const logger = createLogger('stream.utils')

export async function bufferStreamHandler (stream: Stream, res: Response): Promise<boolean> {
    return new Promise((resolve, reject) => {
        stream.on('data', (buffer: Buffer) => {
            try {
                const streamEvent = JSON.parse(buffer.toString().trim())
                console.log({ streamEvent })
                const status = streamEvent.done ? 200 : 207
                if(streamEvent.response) {
                    res.status(status).write(streamEvent.response)
                }
            } catch (error) {
                logger.error(`Error parsing stream: ${error}`)
                resolve(false)
            }
        })
        stream.on("end", () => {
            logger.info('Stream ended')
            resolve(true)
        })
        stream.on("error", (err) => {
            logger.error(`Error in stream: ${err}`)
            reject("LLM stream error")
        })
    })
}