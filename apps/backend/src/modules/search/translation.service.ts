import { Types } from 'mongoose';
import AiClient from '../ai/ai-client.service.js';
import { SearchResultItem } from '../../utils/http/search.js';
import { httpLog } from '../../utils/http/logger.js';

interface QueryTranslationResult {
  detectedLanguage: string;
  languageCode: string;
  translatedQuery: string;
}

/**
 * Detects the language of a search query and translates it to English if it is not already.
 */
export async function detectAndTranslateQuery(
  query: string,
  batchId: Types.ObjectId | null = null
): Promise<QueryTranslationResult> {
  const normalized = query.trim();
  if (!normalized) {
    return { detectedLanguage: 'English', languageCode: 'en', translatedQuery: '' };
  }

  try {
    const aiClient = new AiClient();
    const systemPrompt = `You are an AI language detection and translation assistant.
Analyze the user's input query.
1. Detect the language of the query.
2. If the language is NOT English, translate the query to English.
3. If the language is English, keep the query as-is and set detectedLanguage to "English" and languageCode to "en".
Respond ONLY with a JSON object in this format:
{
  "detectedLanguage": "Name of the detected language (e.g., Spanish, French, Hindi, Japanese)",
  "languageCode": "ISO 639-1 language code (e.g., es, fr, hi, ja, en)",
  "translatedQuery": "The query translated to English (or original query if already English)"
}
Do not include any markdown formatting like \`\`\`json or extra explanations. Respond with raw valid JSON only.`;

    const userContent = `Query: "${normalized.replace(/"/g, "'")}"`;

    const result = await aiClient.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      'translation' as any,
      {
        temperature: 0.1,
        maxTokens: 256,
        batchId: batchId?.toString() ?? undefined,
      }
    );

    const parsed = cleanAndParseJson(result.content) as QueryTranslationResult;
    if (parsed && parsed.detectedLanguage && parsed.languageCode && parsed.translatedQuery) {
      return {
        detectedLanguage: parsed.detectedLanguage,
        languageCode: parsed.languageCode.toLowerCase(),
        translatedQuery: parsed.translatedQuery,
      };
    }
  } catch (err) {
    httpLog.warn(`[translationService] Failed to detect/translate query '${query}': ${(err as Error).message}. Falling back to original query.`);
  }

  return { detectedLanguage: 'English', languageCode: 'en', translatedQuery: query };
}

/**
 * Translates search result fields (question, answer, title, body) back to the user's native language.
 */
export async function translateSearchResults(
  results: SearchResultItem[],
  targetLanguage: string,
  targetLanguageCode: string,
  batchId: Types.ObjectId | null = null
): Promise<SearchResultItem[]> {
  if (results.length === 0) {
    return [];
  }

  const langCode = targetLanguageCode.toLowerCase();
  if (langCode === 'en' || targetLanguage.toLowerCase() === 'english') {
    return results;
  }

  try {
    const aiClient = new AiClient();
    
    // Extract only the translatable fields to keep payload minimal
    const itemsToTranslate = results.map((r, i) => ({
      id: i,
      title: r.title,
      question: r.question,
      answer: r.answer,
      body: r.body,
    }));

    const systemPrompt = `You are a professional translator.
Translate the text values in the provided JSON array to ${targetLanguage} (${targetLanguageCode}).
Important:
1. Translate ONLY the values of the fields: "question", "answer", "title", "body".
2. Do NOT translate the keys or the values of "id" or "source" or any other fields. Keep all keys and non-translatable fields exactly as they are in the input JSON.
3. Keep the JSON structure exactly the same.
4. Respond ONLY with the raw JSON array. Do not include markdown code block formatting (such as \`\`\`json) or any additional text.`;

    const userContent = JSON.stringify(itemsToTranslate, null, 2);

    const result = await aiClient.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      'translation' as any,
      {
        temperature: 0.2,
        maxTokens: 2048,
        batchId: batchId?.toString() ?? undefined,
      }
    );

    const translatedItems = cleanAndParseJson(result.content) as Array<{
      id: number;
      title?: string;
      question?: string;
      answer?: string;
      body?: string;
    }>;

    if (Array.isArray(translatedItems)) {
      const translatedResults = [...results];
      for (const item of translatedItems) {
        const originalResult = translatedResults[item.id];
        if (originalResult) {
          if (item.title !== undefined) originalResult.title = item.title;
          if (item.question !== undefined) originalResult.question = item.question;
          if (item.answer !== undefined) originalResult.answer = item.answer;
          if (item.body !== undefined) originalResult.body = item.body;
        }
      }
      return translatedResults;
    }
  } catch (err) {
    httpLog.warn(`[translationService] Failed to translate search results to ${targetLanguage}: ${(err as Error).message}. Returning untranslated results.`);
  }

  return results;
}

/**
 * Helper to clean markdown block wrapping and parse JSON
 */
function cleanAndParseJson(text: string): any {
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```[a-zA-Z]*\n?/, '');
    clean = clean.replace(/```$/, '');
    clean = clean.trim();
  }
  return JSON.parse(clean);
}
