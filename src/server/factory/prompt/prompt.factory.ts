import createLogger from "fodderlogger"
import createOllamaPromptFactory from "./prompt.ollama3.factory"

const logger = createLogger('prompt.factory')

export class PromptFactory {

    generatePrompt (userConfig: UserPromptData, modelConfig: ModelConfig): string {
        switch(modelConfig.model) {
            case "llama3": return createOllamaPromptFactory().generatePrompt(userConfig)       
            default: return ""
        }
    }
}

export default function createPromptFactory () {
    return new PromptFactory()
}