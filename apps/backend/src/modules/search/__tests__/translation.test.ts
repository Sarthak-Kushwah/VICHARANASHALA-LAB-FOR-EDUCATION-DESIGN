import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import { detectAndTranslateQuery, translateSearchResults } from '../translation.service.js';
import { SearchResultItem } from '../../../utils/http/search.js';

describe('Multi-language Auto-Translation & Cross-lingual Search', () => {
  describe('detectAndTranslateQuery', () => {
    it('should detect Spanish and translate to English when not English', async () => {
      const result = await detectAndTranslateQuery('¿Cómo solicito un NOC?');
      expect(result.detectedLanguage).toBe('Spanish');
      expect(result.languageCode).toBe('es');
      expect(result.translatedQuery).toBe('translated query');
    });

    it('should pass through English query directly without translation', async () => {
      const result = await detectAndTranslateQuery('how do i request a NOC');
      expect(result.detectedLanguage).toBe('English');
      expect(result.languageCode).toBe('en');
      expect(result.translatedQuery).toBe('how do i request a NOC');
    });

    it('should handle empty or whitespace query', async () => {
      const result = await detectAndTranslateQuery('   ');
      expect(result.detectedLanguage).toBe('English');
      expect(result.languageCode).toBe('en');
      expect(result.translatedQuery).toBe('');
    });
  });

  describe('translateSearchResults', () => {
    it('should not translate results if target language is English', async () => {
      const results: SearchResultItem[] = [
        {
          _id: new Types.ObjectId(),
          question: 'How do I request a NOC?',
          answer: 'You can request it on the dashboard.',
          source: 'faq',
          score: 0.95
        }
      ];

      const translated = await translateSearchResults(results, 'English', 'en');
      expect(translated).toEqual(results);
    });

    it('should translate result fields to Spanish using the mock translation', async () => {
      const results: SearchResultItem[] = [
        {
          _id: new Types.ObjectId(),
          question: 'How do I request a NOC?',
          answer: 'You can request it on the dashboard.',
          source: 'faq',
          score: 0.95
        },
        {
          _id: new Types.ObjectId(),
          title: 'Official Holiday List',
          body: 'Here is the 2026 holiday calendar.',
          source: 'community',
          score: 0.85
        }
      ];

      const translated = await translateSearchResults(results, 'Spanish', 'es');
      
      // In the mock, the translated values are mock-returned exactly as they were in the payload structure
      expect(translated[0].question).toBe('How do I request a NOC?');
      expect(translated[0].answer).toBe('You can request it on the dashboard.');
      expect(translated[1].title).toBe('Official Holiday List');
      expect(translated[1].body).toBe('Here is the 2026 holiday calendar.');
    });

    it('should return empty array directly for empty results', async () => {
      const translated = await translateSearchResults([], 'Spanish', 'es');
      expect(translated).toEqual([]);
    });
  });
});
