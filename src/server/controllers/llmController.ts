import { Request, RequestHandler, Response, Router, json } from 'express'
import createLogger from 'fodderlogger/dist'
import cors from 'cors'
import createLlmService, { LlmService } from '../../service/llm-service'
import { bufferStreamHandler } from '../../utils/stream.utils'

const logger = createLogger('llmController')




export class LlmController {
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
    private isValidLlmRequest (req: Request) {
        if(!req || !req.body) return false
        if(!req.body.input || typeof req.body.input !== "string" || req.body.input.length < 1) return false
        if(req.body.system && typeof req.body.system !== "string" && req.body.system.length < 1) return false
        if(req.body.messages && !Array.isArray(req.body.message)) return false
        return true
    }
    /**
     * Registers a GET route on the specified router at the given path.
     * The route handler sends a request to the LLM service to generate a stream
     * of data based on the provided user input. The response is then passed to
     * a bufferStreamHandler function to handle the stream and send the data to
     * the client.
     *
     * @param {Router} router - The router on which to register the route.
     * @param {string} path - The path at which to register the route.
     * @return {void}
     */
    testLlm (router: Router, path: string) {
        router.post(path, async (req: Request, res: Response) => {
            if(!this.isValidLlmRequest(req)) {
                return res.sendStatus(400)
            }
            const { input  = "", system, messages } = req.body as UserPromptData
            
            const response = await this.service.llmGenerate({ input, system, messages })
            if (response === null) {
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
