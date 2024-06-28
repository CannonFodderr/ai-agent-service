import { Request, Response, Router } from 'express'
import createLogger from 'fodderlogger/dist'
import cors from 'cors'
import createLlmService, { LlmService } from '../../service/llm-service'

const logger = createLogger('llmController')

class LlmController {
    private routers: Router[]
    private service: LlmService
    constructor (config: ControllerConfig) {
        this.routers = []
        this.service = createLlmService()
        const llmRouter = Router()
        llmRouter.use(cors({
            origin: 'localhost',
            credentials: true
        }))

        this.testLlm(llmRouter, `${config.baseApi}/llm/test`)

        this.routers.push(llmRouter)
        logger.info('LLM controller initialized')        
    }
    testLlm (router: Router, path: string) {
        router.get(path, (req: Request, res: Response) => {
            this.service.test()
            res.status(200).send({ timestamp: new Date().getTime()})
        })
    }
    getRouters () {
        return this.routers
    }
}


export default function createLlmController (config: ControllerConfig) {
    return new LlmController(config).getRouters()
}