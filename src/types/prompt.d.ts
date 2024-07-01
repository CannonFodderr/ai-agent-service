type PromptConfig = {
    system: string,
}

type PromptRoles = "assistant" | "user"
type PromptMessage = {
    role: PromptRoles,
    message: string
}
type UserPromptData = {
    system?: string,
    input: string,
    messages?: PromptMessage[]
}