export type PromptRoles = "assistant" | "user"
export type PromptMessage = {
    role: PromptRoles,
    message: string
}
export type UserPromptData = {
    system?: string,
    input: string,
    messages?: PromptMessage[],
    config?: LlmRequestConfig,
    context?: any
}