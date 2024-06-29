export class PromptFactory {
    private defaultConfig: PromptConfig
    constructor (config?: PromptConfig) {
        this.defaultConfig = config || this.getDefaultConfig()
    }
    getDefaultConfig (): PromptConfig {
        return {
            system: "You are a a helpful assistant",
        }
    }
    generatePrompt (userConfig: UserPromptData): string {
        const system = userConfig.system || this.defaultConfig.system
        const userInput = userConfig.userInput
        return `
            <|begin_of_text|>
            <|start_header_id|>system<|end_header_id|>
    
                ${system}<|eot_id|>
    
            <|start_header_id|>user<|end_header_id|>
                What is France's capital?<|eot_id|>
            
            <|start_header_id|>assistant<|end_header_id|>
                Bonjour! The capital of France is Paris!<|eot_id|>
    
            <|start_header_id|>user<|end_header_id|>
                What can I do there?<|eot_id|>
            
            <|start_header_id|>assistant<|end_header_id|>
                Paris, the City of Light, offers a romantic getaway with must-see attractions like the Eiffel Tower and Louvre Museum, romantic experiences like river cruises and charming neighborhoods, and delicious food and drink options, with helpful tips for making the most of your trip.<|eot_id|>
                
            <|start_header_id|>user<|end_header_id|>
                ${userInput}<|eot_id|>

            <|start_header_id|>assistant<|end_header_id|>
        `
    }
}

export default function createPromptFactory () {
    return new PromptFactory()
}