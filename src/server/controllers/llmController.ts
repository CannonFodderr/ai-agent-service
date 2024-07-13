import { Request, RequestHandler, Response, Router, json } from 'express'
import createLogger from 'fodderlogger/dist'
import cors from 'cors'
import createLlmService, { OllamaService } from '../../service/ollama-service'
import { bufferStreamHandler, bufferStreamToString, isStream } from '../../utils/stream.utils'
import { UserPromptData } from '../../types/prompt.types'
import { OllamaEmbeddingRequestPayload } from '../../types/ollama.types'

const logger = createLogger('llmController', { debug: true })




export class LlmController {
    private routers: Router[]
    private service: OllamaService
    constructor (config: ControllerConfig) {
        this.routers = []
        this.service = createLlmService()
        const llmRouter = Router()
        llmRouter.use(cors({
            origin: 'localhost',
            credentials: true
        }))
        llmRouter.use(json())

        this.chatLlm(llmRouter, `${config.baseApi}/llm/chat`)

        this.routers.push(llmRouter)
        logger.info('LLM controller initialized')
        
    }
    private isValidLlmRequest (req: Request) {
        if(!req || !req.body) return false
        if(!req.body.input || typeof req.body.input !== "string" || req.body.input.length < 1) return false
        if(req.body.system && typeof req.body.system !== "string" && req.body.system.length < 1) return false
        if(req.body.messages && !Array.isArray(req.body.messages)) return false
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
    chatLlm (router: Router, path: string) {
        router.post(path, async (req: Request, res: Response) => {
            if(!this.isValidLlmRequest(req)) {
                return res.sendStatus(400)
            }
            const userData = req.body as UserPromptData
            const streaming = userData.config?.streaming === false ? false : true
            const response = await this.service.llmGenerate(userData)
            
            if (response === null) {
                logger.error('Error getting LLM stream')
                return res.sendStatus(500)
            }
            const { data } = response
            if(streaming) {
                const done = await bufferStreamHandler(data, res)
                if (!done) {
                    logger.warn('LLm stream ended unexpectedly')
                }
                res.end()
            } else {
                if(isStream(data)) {
                    const str = await bufferStreamToString(data)
                    logger.debug(`Returning LLM STREAM to JSON response`)
                    return res.json({ str })
                } else {
                    logger.debug(`Returning LLM to JSON response`)
                    return res.json({ response: data.response.replace(/\n/g,' ') })
                }

                // logger.error(`Error getting LLM stream, isStream: ${isStream}`)
                // return res.sendStatus(500)
                
            }
            
        })
    }
    private isValidEmbeddingRequest (req: Request) {
        if(!req || !req.body) return false
        return true
    }
    createEmbeddings (router: Router, path: string) {
        router.post(path, async (req: Request, res: Response) => {
            if(!this.isValidEmbeddingRequest(req)) {
                logger.error(`Bad payload for embedding request`)
                return res.sendStatus(400)
            }
            const embedingPayload = req.body as OllamaEmbeddingRequestPayload
            const created = await this.service.generateEmbeddings(embedingPayload)
            if(!created) {
                logger.error(`Error generating embeddings`)
                return res.sendStatus(500)
            }
            return res.sendStatus(200)
        })
    }
    getRouters () {
        return this.routers
    }
}


export default function createLlmController (config: ControllerConfig) {
    return new LlmController(config).getRouters()
}
