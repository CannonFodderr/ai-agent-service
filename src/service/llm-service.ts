import Axios, { AxiosResponse } from "axios"
import createLogger from "fodderlogger/dist"
import getConfig from "../config"
import generatePrompt, { PromptFactory } from "../server/factory/prompt.factory"
import createPromptFactory from "../server/factory/prompt.factory"
import { buffer } from "stream/consumers"
import { Stream } from "stream"

const logger = createLogger('llm-service')
const config = getConfig()
let service: LlmService | undefined

export class LlmService { 
    private promptFactory: PromptFactory
    constructor () {
        this.promptFactory = createPromptFactory()
    }
    llmGenerate (userData: UserPromptData) {
            try {
                const baseURL = `${config?.OLLAMA_HOST}:${config?.OLLAMA_PORT}`
                const axios = Axios.create({ baseURL })
                
                const payload = {
                    "model": "llama3",
                    "prompt": this.promptFactory.generatePrompt({ input: userData.input, system: userData.system, messages: userData.messages })

                }
                return axios.post("/api/generate", payload, {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    responseType: "stream"
                })

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