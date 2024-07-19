import createLogger from "fodderlogger/dist"

const logger = createLogger('json-parser-util')

export function parseJSON (data: any) {
    try {
        return JSON.parse(data)
    } catch (error) {
        logger.error(`parseJSON: Error parsing JSON: ${error}`)
        return null
    }
}