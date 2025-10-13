export interface PdfProcessorOptions {
    /** The PDF file as a Buffer */
    pdfBuffer: Buffer;
    /** Optional: Gemini API key. If not provided, will use env var */
    apiKey?: string;
    /** Optional: Model to use for conversion. Defaults to 'gemini-2.5-pro' */
    model?: string;
    /** Optional: Original filename for metadata */
    originalFileName?: string;
}
export interface PdfProcessorResult {
    /** The converted markdown content */
    markdown: string;
    /** Processing metadata */
    metadata: {
        originalFileName?: string;
        processingTimestamp: string;
        modelUsed: string;
        costs: {
            input: number;
            output: number;
            total: number;
        };
    };
}
//# sourceMappingURL=pdfProcessor.type.d.ts.map