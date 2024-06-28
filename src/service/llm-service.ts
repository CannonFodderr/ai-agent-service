import Axios from "axios"
import createLogger from "fodderlogger/dist"
import getConfig from "../config"

const logger = createLogger('llm-service')
const config = getConfig()
let service: LlmService | undefined

export class LlmService { 
    constructor () {

    }
    async test () {
            try {
                const baseURL = `${config?.OLLAMA_HOST}:${config?.OLLAMA_PORT}`
                const axios = Axios.create({ baseURL })
                
                const payload = {
                    "model": "llama3",
                    "prompt":"Why is the sky blue?"
                }
                const { data } = await axios.post("/api/generate", payload, {
                    headers: {
                        "Content-Type": "application/json"
                    }
                })
                console.log({ data })
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