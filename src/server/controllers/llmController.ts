import { Request, Response, Router, json } from 'express'
import createLogger from 'fodderlogger/dist'
import cors from 'cors'
import createLlmService, { LlmService } from '../../service/llm-service'
import { bufferStreamHandler } from '../../utils/stream.utils'

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
        llmRouter.use(json())

        this.testLlm(llmRouter, `${config.baseApi}/llm/test`)

        this.routers.push(llmRouter)
        logger.info('LLM controller initialized')        
    }
    testLlm (router: Router, path: string) {
        router.get(path, async (req: Request, res: Response) => {


            const response = await this.service.test({ userInput: "Give me a detailed list of the attractions I should visit, and time it takes in each one, to plan my trip accordingly." })
            if(!response) {
                logger.error('Error getting LLM stream')
                return res.sendStatus(500)
            }
            const { data: stream } = response
            const done = await bufferStreamHandler(stream, res)
            if (!done) {
                res.end()
            }
        })
    }
    getRouters () {
        return this.routers
    }
}


export default function createLlmController (config: ControllerConfig) {
    return new LlmController(config).getRouters()
}