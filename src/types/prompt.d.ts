type PromptSystemConfig = {
    general: string,
    intent: string,
    tools: string
}

type PromptRoles = "assistant" | "user"
type PromptMessage = {
    role: PromptRoles,
    message: string
}
type LlmRequestConfig = {
    streaming: boolean
}
type UserPromptData = {
    system?: string,
    input: string,
    messages?: PromptMessage[],
    config?: LlmRequestConfig
}