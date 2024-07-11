import createLogger from "fodderlogger"
import createOllamaPromptFactory, { LLM_FUNCTION } from "./prompt.ollama3.factory"
import { OllamaModelConfig } from "../../types/ollama.types"
import { UserPromptData } from "../../types/prompt.types"

const logger = createLogger('prompt.factory')

export class PromptFactory {

    generatePrompt (userConfig: UserPromptData, modelConfig: OllamaModelConfig, llmFunction?: LLM_FUNCTION): string {
        switch(modelConfig.model) {
            case "llama3": return createOllamaPromptFactory().generatePrompt(userConfig, llmFunction)       
            default: return ""
        }
    }
}

export default function createPromptFactory () {
    return new PromptFactory()
}