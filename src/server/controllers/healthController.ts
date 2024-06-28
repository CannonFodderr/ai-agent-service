import { Request, Response, Router } from 'express'
import createLogger from 'fodderlogger/dist'
import cors from 'cors'

const logger = createLogger('healthController')

class HealthController {
    private routers: Router[]
    constructor (config: ControllerConfig) {
        this.routers = []
        const healthRouter = Router()
        healthRouter.use(cors({
            origin: 'localhost',
            credentials: true
        }))

        this.checkHealth(healthRouter, `${config.baseApi}/health`)

        this.routers.push(healthRouter)
        logger.info('Health controller initialized')        
    }
    checkHealth (router: Router, path: string) {
        router.get(path, (req: Request, res: Response) => {
            res.status(200).send({ timestamp: new Date().getTime()})
        })
    }
    getRouters () {
        return this.routers
    }
}


export default function createHealthController (config: ControllerConfig) {
    return new HealthController(config).getRouters()
}