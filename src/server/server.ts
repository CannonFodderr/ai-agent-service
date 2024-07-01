import express, { Express, Router } from 'express'
import createLogger from 'fodderlogger/dist'
import createHealthController from './controllers/healthController'
import createLlmController from './controllers/llmController'

const API_VERSION = 'v1'
const controllersList: ControllersList = [
    { 
        name: 'health',
        init: createHealthController, 
        config: {
            baseApi: `/api/${API_VERSION}`
        }
    },
    { 
        name: 'llm',
        init: createLlmController,
        config: {
        baseApi: `/api/${API_VERSION}`
    }}
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
        const controllerConfig: ControllerConfig = {
            baseApi: `/api/${API_VERSION}`
        }
        controlersToMount.forEach(c => {
            const controllerRouters: Router[] = c.init(controllerConfig)
            controllerRouters.forEach(r => this.app.use(r))
        })
    }
    listen () {
        const port = this.config.SERVER_HTTP_PORT || 9000
        this.app.listen(this.config.SERVER_HTTP_PORT, () => logger.success(`Server is listening on port ${port}`))
    }
}



export default function createServer (config: Config) {
    return new server(config)
}