
import createLogger from "fodderlogger/dist"
import getConfig from "../config"
import { PromptFactory } from "../factory/prompt/prompt.factory"
import createPromptFactory from "../factory/prompt/prompt.factory"
import { LLM_FUNCTION } from "../factory/prompt/prompt.ollama3.factory"
import createToolsModule, { ExecutorResponse, ToolsModule } from "../modules/tools.module"
import { parseJSON } from "../utils/json-parser.util"
import { OllamaEmbeddingRequestPayload, OllamaGenerateRequestPayload, OllamaModel } from '../types/ollama.types'
import createApiService, { ApiService } from "./api-service"
import { UserPromptData } from "../types/prompt.types"
import { ValidTool } from "../types/tools.types"
import { removeLineBreaks, removeTags } from '../utils/string-parser.util'
import { bufferStreamToString, isStream } from "../utils/stream.utils"
const logger = createLogger('llm-service', { debug: true })
const config = getConfig()


let service: OllamaService | undefined

export class OllamaService { 
    private promptFactory: PromptFactory
    private toolsModule: ToolsModule
    private availableModels: OllamaModel[]
    private ollamaCLient: ApiService
    private initialized: boolean
    constructor () {
        this.promptFactory = createPromptFactory()
        this.toolsModule = createToolsModule()
        this.availableModels = []
        this.ollamaCLient = createApiService(`${config?.OLLAMA_HOST}:${config?.OLLAMA_PORT}`)
        this.initialized = false

        this.init()
    }
    async init () {
        this.initialized = false
        this.availableModels = await this.getModelsList()
        this.initialized = true
    }
    status () {
        return {
            initialized: this.initialized,
            models: this.availableModels
        }
    }
    private selectModel (modelName: string) {
        const [ name ] = modelName.split(":")
        const selected = name && this.availableModels.map(m => m.name).includes(name) ? name : this.availableModels[0].name
        return selected
    }
    async getModelsList () {        
        try {
            const { data } = await this.ollamaCLient.get("/api/tags")
            this.availableModels = Array.isArray(data.models) ? data.models.map((m: OllamaModel) => {
                const [name, version] = m.name.split(":")
                return {
                    ...m,
                    name: name,
                    version: version
                }
            }) : []
            logger.success("Ollama models list: ")
            logger.table(this.availableModels.map((m: OllamaModel) => {

                return {
                    name: m.name,
                    family: m.details.family,
                }
            }))
            if(this.availableModels.length < 1) {
                throw new Error("No Ollama models found")
            }
            return this.availableModels
        } catch (error) {
            logger.error(`Failed to get OLLAMA models list: ${error}`)
            return []
        }
    }
    private async triggerLLM (payload: OllamaGenerateRequestPayload) {
        const res = await this.ollamaCLient.post("/api/generate", payload, {
            headers: {
                "Content-Type": "application/json"
            },
            responseType:  payload.stream ? "stream" : "json"
        })
        if(res.status !== 200) {
            logger.warn(`LLM Response status: ${res.status}`)
        }
        const { data } = res
        if(isStream(data) && !payload.stream) {
            logger.warn(`LLM Response is STREAM, should be JSON... converting to string`)
            const str = await bufferStreamToString(res.data)
            return { data: { response: str } }
        }
        logger.debug(`LLM Response is JSON, returning`)
        return res
    }
    async generateEmbeddings (payload: OllamaEmbeddingRequestPayload) {
        if(!payload.model) {
            payload.model = 'nomic-embed-text:latest'
        }
        const embdRes = await this.ollamaCLient.post("/api/embeddings", payload)
        if(!embdRes || !embdRes.data) {
            logger.error(`Failed to generate embeddings: ${JSON.stringify(embdRes)}`)
            return null
        }
        return embdRes.data.embedding
    }
    async llmIntentDetection (userData: UserPromptData) {
        if(!this.availableModels.length) return logger.error("Ollama models not available")
        
        const model: string = this.selectModel(userData.config?.model || "")
        const { input, system, messages } = userData
        const prompt = this.promptFactory.generatePrompt({ 
            input,
            system,
            messages,
        }, 
        {
            model 
        }, LLM_FUNCTION.INTENT_DETECTION)
        const payload: OllamaGenerateRequestPayload = {
            model,
            prompt,
            stream: false
        }
        return await this.triggerLLM(payload)
    }
    async llmCheckTools (userData: UserPromptData) {
        if(!userData.config?.toolModel) {
            logger.error(`Tool model is not defined`)
            return null
        }
        if(!this.availableModels.length) {
            logger.error("Ollama models not available")
            return null
        }
        
        const model: string = this.selectModel(userData.config.toolModel)
        const { input, messages } = userData
        const prompt = this.promptFactory.generatePrompt({ 
            input,
            messages
        }, 
        {
            model 
        }, LLM_FUNCTION.TOOLS_DETECTION)

        const payload: OllamaGenerateRequestPayload = {
            model,
            prompt,
            stream: false
        }

        const res = await this.triggerLLM(payload)
        if(!res || !res.data) {
            logger.error("Failed to get tools response")
            return null
        }
        const { response } = res.data
        if(!response || typeof response !== 'string') {
            console.error(`Empty Response: ${response } or bad type response from LLM: ${typeof response}`)
            return null
        }
        const trimmedResponse = response.trim()
        if(!trimmedResponse) {
            logger.error(`trimmed response is empty: ${response}`)
            return null
        }
        const normalizedResponse = removeTags(removeLineBreaks(trimmedResponse))
        const json = parseJSON(normalizedResponse)
        if(!json) {
            logger.error(`Failed to parse tools response: ${response}`)
            return null
        }
        const normalizedToolsRes = Array.isArray(json) ? json : [json]
        const validatedTools: ValidTool[] = []

        for (const tool of normalizedToolsRes) {
            if(!tool || !tool.name) {
                logger.error(`Invalid tool response: ${JSON.stringify(tool)}`)
                continue
            }
            validatedTools.push({
                name: tool.name,
                arguments: tool.arguments
            })
        }
        return validatedTools
    }
    private async executeTool (toolName: string): Promise<null | ExecutorResponse> {
        if(!toolName || toolName.toLowerCase() === 'none') {
            logger.error(`Tool ${toolName} not found`)
            return null
        }
        try {
            return await this.toolsModule.executeTool(toolName)
        } catch (error) {
            logger.error(`Failed to execute tool ${toolName}: ${error}`)
            return null
        }        
    }
    async llmGenerate (userData: UserPromptData) {
            if(!userData.input) {
                logger.error(`User input is empty`)
                return null
            }
            try {
                // logger.debug(`Testing LLM service`)
                let context: null | ExecutorResponse = null
                if(userData.config?.toolModel) {
                    const toolsList = await this.llmCheckTools(userData) || []
                    logger.debug(`Tools list: ${JSON.stringify(toolsList)}`)
                    for (const tool of toolsList) {
                        // We only need to execute one tool
                        context = await this.executeTool(tool.name)
                        if(context) {
                            break
                        }
                    }
                }
                const { input, system, messages, config } = userData
                const model: string = this.selectModel(config?.model || "")
                // const streaming = userData.config?.streaming === false ? false : true // default to stream
                const prompt = this.promptFactory.generatePrompt({ 
                    input,
                    system,
                    messages,
                    context: context || undefined
                }, 
                {
                    model 
                })
                const payload: OllamaGenerateRequestPayload = {
                    model,
                    prompt,
                    stream: true
                }
                return await this.triggerLLM(payload)
            } catch (error) {
                logger.error(`Error testing LLM service: ${error}`)
                return null
            }
    }
}



export default function createOllamaService () {
    if(!service) {
        service = new OllamaService()
        logger.info('LLM service initialized')
    }
    return service
}