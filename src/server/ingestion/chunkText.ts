import type { PageText } from "./extractText";


export type Chunk = {
    pageNumber: number;
    text: string;
    chunkIndex: number;
    content: string;
}

//size ek chunk mein kitne words, overlap = pichle chunk ke kitne words dobara
export function chunkPages(pages: PageText[],size = 500, overlap = 50): Chunk[] {
    const chunks: Chunk[] = [];
    const step = size - overlap; 
    let index = 0;

    for (const page of pages) {
        const words = page.text.split(/\s+/).filter(Boolean);
        if(words.length === 0) continue; // Khali page chod do

        for(let start = 0; start < words.length; start += step) {
            const slice = words.slice(start, start + size);
            chunks.push({
                pageNumber: page.pageNumber,
                text: page.text,
                chunkIndex: index++,
                content: slice.join(" "),
            });
            if(start + size >= words.length) break; // aakhri tukda hogaya h
        }
    }

    return chunks;
}