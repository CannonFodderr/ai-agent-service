export function removeLineBreaks (str: string) {
    return str.replace(/\r?\n|\r/g, "")
}
export function removeTags (str: string) {
    return str.replace(/<([^</> ]+)[^<>]*?>[^<>]*?<\/\1> */gi, "")
}