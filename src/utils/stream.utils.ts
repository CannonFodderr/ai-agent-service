import { Response } from "express";
import createLogger from "fodderlogger/dist";
import { Stream } from "stream";
import { isDebugMode } from "./debugger.util";

const logger = createLogger('stream.utils', { debug: isDebugMode() })


function createValidStreamEvent(eventName: string, data: any) {
    const dataStr = typeof data === "string" ? data : JSON.stringify(data)
    return `event: ${eventName}\n
    data: ${dataStr}\n\n
    `
}
export async function bufferStreamHandler (stream: Stream, res: Response): Promise<boolean> {
    return new Promise((resolve, reject) => {
        let debugAnswer = '\n'
        stream.on('data', (buffer: Buffer) => {
            try {
                
                const streamEvent = JSON.parse(buffer.toString().trim())
                const status = streamEvent.done ? 200 : 207
                if(streamEvent.response) {
                    const event = createValidStreamEvent('llm-answer-chunk',streamEvent.response)
                    if(isDebugMode()) {
                        debugAnswer += streamEvent.response
                    }    
                    res.status(status).write(event)
                }
            } catch (error) {
                logger.error(`Error parsing stream: ${error}`)
                resolve(false)
            }
        })
        stream.on("end", () => {
            logger.debug('Stream ended')
            if(isDebugMode()) {
                logger.debug(debugAnswer)
            }
            res.end()
            resolve(true)
        })
        stream.on("error", (err) => {
            logger.error(`Error in stream: ${err}`)
            reject("LLM stream error")
        })
    })
}
export async function bufferStreamToString (stream: Stream): Promise<string | null> {
    return new Promise((resolve) => {
        let answer = ""
        stream.on('data', (buffer: Buffer) => {
            try {
                const streamEvent = JSON.parse(buffer.toString().trim())
                // const status = streamEvent.done ? 200 : 207
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
            logger.debug({ answer })
            resolve(answer)
        })
        stream.on("error", (err) => {
            logger.error(`LLM stream error: ${err}`)
            resolve(null)
        })
    })
}


export function isStream (val: any): boolean {
    return val !== null && typeof val === 'object' && typeof val.pipe === 'function';
}