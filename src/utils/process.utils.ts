import createLogger from "fodderlogger/dist"

const logger = createLogger('process-utils')

export function panic (code: number | string | undefined = 0, message: string = "Panic!") {
    logger.error(message)
    process.exit(code)
}