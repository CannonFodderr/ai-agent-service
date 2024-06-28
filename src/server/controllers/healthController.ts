import { Request, Response, Router } from 'express'
import createLogger from 'fodderlogger/dist'
const logger = createLogger('healthController')

class HealthController {
    private routers: Router[]
    constructor () {
        this.routers = []
        const healthRouter = Router()
        

        this.checkHealth(healthRouter, "/health")

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


export default function createHealthController () {
    return new HealthController().getRouters()
}