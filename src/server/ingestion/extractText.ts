import { extractText,getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

export type PageText = { pageNumber: number; text: string };

//File ke bytes se page-wise text extract karo (extractText)
export async function extractPages(bytes: Buffer, ext: string): Promise<PageText[]> {
    if(ext === '.pdf') {
        //PDF lenge
        const pdf = await getDocumentProxy(new Uint8Array( bytes));
        const { text } = await extractText(pdf, {mergePages: false });
        return text.map((t, i) => ({ pageNumber: i + 1, text: t }));
    }

    if(ext === ".docx") {
        // Docx mein pages nhi hote toh poora test result mein store kr lenge
        const result = await mammoth.extractRawText({ buffer: bytes });
        return [{ pageNumber: 1, text: result.value.trim() }];
    }

    if(ext === ".txt") {
        return [{ pageNumber: 1, text: bytes.toString("utf-8").trim() }];
    }

    throw new Error("Unsupported file type");
}