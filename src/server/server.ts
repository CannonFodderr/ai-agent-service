import express, { Express, Router } from 'express'
import createLogger from 'fodderlogger/dist'
import createHealthController from './controllers/healthController'

const API_VERSION = 'v1'
const controllersList: ControllersList = [
    { name: 'health', init: createHealthController }
]

const logger = createLogger('server')
class server {
    private app: Express
    private config: Config
    constructor (config: Config) {
        this.app = express()
        this.config = config

        this.mountControllers()
        logger.success('Server initialized')
    }
    private async mountControllers (includeControllers: ControllerName[] = []) {
        const controlersToMount = includeControllers.length ? controllersList.filter(item => includeControllers.includes(item.name)) : controllersList
        controlersToMount.forEach(c => {
            const controllerRouters: Router[] = c.init()
            controllerRouters.forEach(r => {
                this.app.use(r)
            })
        })
    }
    listen () {
        this.app.listen(this.config.SERVER_HTTP_PORT, () => logger.success(`Server is listening on port ${this.config.SERVER_HTTP_PORT}`))
    }
}



export default function createServer (config: Config) {
    return new server(config)
}