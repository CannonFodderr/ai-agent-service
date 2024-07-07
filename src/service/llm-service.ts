import Axios, { AxiosResponse } from "axios"
import createLogger from "fodderlogger/dist"
import getConfig from "../config"
import { PromptFactory } from "../server/factory/prompt/prompt.factory"
import createPromptFactory from "../server/factory/prompt/prompt.factory"
import { LLM_FUNCTION } from "../server/factory/prompt/prompt.ollama3.factory"
import createToolsModule, { ToolsModule } from "../modules/tools.module"

const logger = createLogger('llm-service')
const config = getConfig()


let service: LlmService | undefined

export class LlmService { 
    private promptFactory: PromptFactory
    private toolsModule: ToolsModule
    constructor () {
        this.promptFactory = createPromptFactory()
        this.toolsModule = createToolsModule()
        this.llmListModels()
    }
    private async llmListModels () {
        const baseURL = `${config?.OLLAMA_HOST}:${config?.OLLAMA_PORT}`
        const axios = Axios.create({ baseURL })
        const { data } = await axios.get("/api/tags")
        logger.info({ data: JSON.stringify(data) })
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
        const model: LlmModel = "llama3"
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
        const model: LlmModel = "llama3"
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
                let context
                const { data } = await this.llmCheckTools(userData)
                if(data && data.response && typeof data.response === "string") {
                    try {
                        const jsonRes = JSON.parse(data.response.trim())
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
                                return data.response
                            }
                        }
                        logger.error("Error parsing LLM response")
                        return null
                    }
                }
                const model: LlmModel = "llama3"
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
        service = new LlmService()
        logger.info('LLM service initialized')
    }
    return service
}