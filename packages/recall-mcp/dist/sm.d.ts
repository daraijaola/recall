/**
 * Minimal Supermemory Local HTTP client for the MCP process.
 * Isolated from the Next.js app — only talks to localhost:6767 (or RECALL_SM_URL).
 */
export type SmConfig = {
    url: string;
    apiKey: string;
    container: string;
};
export declare function loadConfig(): SmConfig;
export type SearchHit = {
    id?: string;
    text: string;
    score: number;
    source?: string;
    type?: string;
    recallMemoryId?: string;
};
export declare function smSearch(query: string, limit?: number): Promise<SearchHit[]>;
export declare function smAdd(content: string, customId?: string): Promise<{
    id: string;
    status: string;
}>;
export declare function smDelete(id: string): Promise<void>;
export declare function smList(limit?: number): Promise<Array<{
    id: string;
    title?: string;
    summary?: string;
}>>;
/** Prefer app context-pack when RECALL_APP_URL is set; else synthesize from SM. */
export declare function buildContext(query?: string): Promise<string>;
