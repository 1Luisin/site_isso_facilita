export const contentTypes = {carousel:"Carrossel",video:"Vídeo",post:"Post",short:"Reel / Short"} as const;
export type ContentType = keyof typeof contentTypes;
export function contentTypeLabel(type: ContentType) { return contentTypes[type]; }
