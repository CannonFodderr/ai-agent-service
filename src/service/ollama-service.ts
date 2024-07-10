import Axios from "axios"
import createLogger from "fodderlogger/dist"
import getConfig from "../config"
import { PromptFactory } from "../factory/prompt/prompt.factory"
import createPromptFactory from "../factory/prompt/prompt.factory"
import { LLM_FUNCTION } from "../factory/prompt/prompt.ollama3.factory"
import createToolsModule, { ExecutorResponse, ToolsModule } from "../modules/tools.module"
import { isValidJSON } from "../utils/json-parser.util"
import { OllamaGenerateRequestPayload, OllamaModel } from '../types/ollama-types'
const logger = createLogger('llm-service')
const config = getConfig()


let service: OllamaService | undefined

export class OllamaService { 
    private promptFactory: PromptFactory
    private toolsModule: ToolsModule
    private availableModels: OllamaModel[]
    constructor () {
        this.promptFactory = createPromptFactory()
        this.toolsModule = createToolsModule()
        this.availableModels = []
        this.llmListModels()
    }
    private async llmListModels () {
        const baseURL = `${config?.OLLAMA_HOST}:${config?.OLLAMA_PORT}`
        const axios = Axios.create({ baseURL })
        const { data } = await axios.get("/api/tags")
        this.availableModels.push(...data.models)

        logger.success("Ollama models list: ")
        logger.table(data.models.map((m: OllamaModel) => {
            return {
                name: m.name,
                family: m.details.family
            }
        }))
        // data.models.forEach((m: OllamaModel, i: number) => logger.info(`${i + 1}.Model: ${m.name} - ${m.details.family}`))
    }
    private triggerLLM (payload: OllamaGenerateRequestPayload) {
        const baseURL = `${config?.OLLAMA_HOST}:${config?.OLLAMA_PORT}`
                const axios = Axios.create({ baseURL })

        return axios.post("/api/generate", payload, {
            headers: {
                "Content-Type": "application/json"
            },
            responseType:  payload.stream ? "stream" : "json"
        })

    }
    async llmIntentDetection (userData: UserPromptData) {
        if(!this.availableModels.length) return logger.error("Ollama models not available")
        
        const model: string = this.availableModels[0].name
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
        if(!this.availableModels.length) {
            logger.error("Ollama models not available")
            return null
        }

        const model: string = this.availableModels[0].name
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
        const toolsLlmRes = await this.triggerLLM(payload)
        return toolsLlmRes
    }
    async llmGenerate (userData: UserPromptData) {
            try {
                let context: undefined | ExecutorResponse
                const res = await this.llmCheckTools(userData)
                if(!res || !res.data) {
                    logger.error("Failed to get tools response")
                    return null
                }
                const { response } = res.data
                if(response && typeof response === "string") {
                    let toParse = response
                    const jsonValid = isValidJSON(response)
                    if(!jsonValid) {
                        // Retry if not valid JSON
                        const secondaryToolsRequest = await this.llmCheckTools({ input: `This answer: ${response} is not a valid json format... refactor your answer to only return a valid JSON`})
                        if(secondaryToolsRequest) {
                            toParse = secondaryToolsRequest.data.respone
                        }
                    }
                    try {
                        const jsonRes = JSON.parse(toParse.trim().replace(/\n/g,","))
                        const { tool: toolName } = jsonRes
                        if(toolName && toolName.toLowerCase() !== 'none') {
                            const toolData = await this.toolsModule.executeTool(toolName)
                            if(toolData) {
                                context = toolData
                            }
                        }
                    } catch (error) {
                        if(error instanceof Error) {
                            logger.warn(error.name, error.message)
                            if (error.name === 'SyntaxError' && error.message.indexOf("not valid JSON")) {
                                logger.error(`Error parsing LLM response: ${error.message}`)
                            }
                        }
                        logger.error("Error parsing LLM response")
                        return null
                    }
                }
                const model: string = this.availableModels[0].name
                const { input, system, messages } = userData
                // const streaming = userData.config?.streaming === false ? false : true // default to stream
                const prompt = this.promptFactory.generatePrompt({ 
                    input,
                    system,
                    messages,
                    context
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



export default function createLlmService () {
    if(!service) {
        service = new OllamaService()
        logger.info('LLM service initialized')
    }
    return service
}