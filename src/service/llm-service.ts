import Axios, { AxiosResponse } from "axios"
import createLogger from "fodderlogger/dist"
import getConfig from "../config"
import { PromptFactory } from "../server/factory/prompt/prompt.factory"
import createPromptFactory from "../server/factory/prompt/prompt.factory"
import { LLM_FUNCTION } from "../server/factory/prompt/prompt.ollama3.factory"

const logger = createLogger('llm-service')
const config = getConfig()


// const tools = ['general-talk', 'encrypt']

let service: LlmService | undefined

export class LlmService { 
    private promptFactory: PromptFactory
    constructor () {
        this.promptFactory = createPromptFactory()
        this.llmListModels()
    }
    private async llmListModels () {
        const baseURL = `${config?.OLLAMA_HOST}:${config?.OLLAMA_PORT}`
        const axios = Axios.create({ baseURL })
        const { data } = await axios.get("/api/tags")
        console.log({ data: JSON.stringify(data) })
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
        const { input, system, messages } = userData
        const prompt = this.promptFactory.generatePrompt({ 
            input,
            system,
            messages,
        }, 
        {
            model 
        }, LLM_FUNCTION.TOOLS_DETECTION)
        const payload: OllamaGenerateRequestPayload = {
            model,
            prompt,
            stream: false
        }
        return await this.triggerLLM(payload)
    }
    async llmGenerate (userData: UserPromptData) {
            try {
                // const { data } = await this.llmIntentDetection(userData)
                // if(data && data.response && typeof data.response === "string") {
                //     const jsonRes = JSON.parse(data.response.trim())
                //     console.log({ jsonRes })
                // }
                const { data } = await this.llmCheckTools(userData)
                if(data && data.response && typeof data.response === "string") {
                    const jsonRes = JSON.parse(data.response.trim())
                    console.log({ jsonRes })
                }
                const model: LlmModel = "llama3"
                const { input, system, messages } = userData
                // const streaming = userData.config?.streaming === false ? false : true // default to stream
                const prompt = this.promptFactory.generatePrompt({ 
                    input,
                    system,
                    messages,
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