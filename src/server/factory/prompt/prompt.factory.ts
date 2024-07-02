import createLogger from "fodderlogger"
import createOllamaPromptFactory, { LLM_FUNCTION } from "./prompt.ollama3.factory"

const logger = createLogger('prompt.factory')

export class PromptFactory {

    generatePrompt (userConfig: UserPromptData, modelConfig: ModelConfig, llmFunction?: LLM_FUNCTION): string {
        switch(modelConfig.model) {
            case "llama3": return createOllamaPromptFactory().generatePrompt(userConfig, llmFunction)       
            default: return ""
        }
    }
}

export default function createPromptFactory () {
    return new PromptFactory()
}