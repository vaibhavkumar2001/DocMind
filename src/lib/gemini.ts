import { GoogleGenAI } from "@google/genai";



let client: GoogleGenAI | null = null;
//yeh client isliye banaya h iska kaam yeh h ki yeh yaad rakhta h ki client ko taaki baar baar naya naa banan pade

export function gemini() {
    if(!client) {
        const apiKey = process.env.GEMINI_API_KEY;
        if(!apiKey) throw new Error("GEMINI_API_KEY missing");
        client = new GoogleGenAI({ apiKey });
    }
    return client;
}

export const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-flash-latest";