import express, { Express } from 'express'
import createLogger from 'fodderlogger/dist'

const logger = createLogger('server')
class server {
    private app: Express
    private config: Config
    constructor (config: Config) {
        this.app = express()
        this.config = config
    }
    listen () {
        this.app.listen(this.config.SERVER_HTTP_PORT, () => logger.success(`Server is listening on port ${this.config.SERVER_HTTP_PORT}`))
    }
}



export default function createServer (config: Config) {
    return new server(config)
}