import createLogger from "fodderlogger/dist"

const logger = createLogger('json-parser-util')

export function isValidJSON (data: any) {
    try {
        JSON.parse(data)
    } catch (error) {
        logger.error(`Error validating JSON: ${error}`)
        return false
    }
    return true
}