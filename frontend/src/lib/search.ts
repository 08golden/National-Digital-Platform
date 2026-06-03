import { LANGUAGES } from '../constants';
import { Category, ContentItem } from '../types';

type SearchOptions = {
  query?: string;
  languageId?: string;
  category?: Category | null;
};

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  Articles: ['article', 'articles', 'paper', 'papers', 'research', 'linguistics', 'study', 'studies', 'scholarship'],
  Audio: ['audio', 'recording', 'recordings', 'music', 'song', 'songs', 'oral', 'voice', 'voices', 'listening'],
  Video: ['video', 'film', 'visual', 'watch', 'documentation', 'documentary'],
  Books: ['book', 'books', 'guide', 'guides', 'text', 'texts', 'publication'],
};

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9!]+/g, ' ')
    .trim();

const includesTerm = (field: string, term: string) =>
  field.split(' ').some(word => word === term || word.startsWith(term));

const fieldScore = (field: string, query: string, terms: string[], phraseWeight: number, termWeight: number) => {
  if (!field) return 0;

  let score = field.includes(query) ? phraseWeight : 0;
  score += terms.reduce((total, term) => total + (includesTerm(field, term) ? termWeight : 0), 0);
  return score;
};

const languageNameFor = (languageId: string) =>
  normalize(LANGUAGES.find(language => language.id === languageId)?.name ?? languageId);

const searchableFieldsFor = (item: ContentItem) => {
  const categoryKeywords = CATEGORY_KEYWORDS[item.category].join(' ');

  return {
    title: normalize(item.title),
    author: normalize(item.author ?? ''),
    description: normalize(item.description),
    transcript: normalize(item.transcript ?? ''),
    category: normalize(`${item.category} ${categoryKeywords}`),
    language: languageNameFor(item.languageId),
    date: normalize(item.date ?? ''),
  };
};

export const searchContent = (items: ContentItem[], options: SearchOptions = {}) => {
  const query = normalize(options.query ?? '');
  const terms = query.split(' ').filter(Boolean);

  return items
    .filter(item => {
      const languageMatches = !options.languageId || options.languageId === 'all' || item.languageId === options.languageId;
      const categoryMatches = !options.category || item.category === options.category;

      if (!languageMatches || !categoryMatches) return false;
      if (!query) return true;

      const fields = searchableFieldsFor(item);
      const combinedFields = Object.values(fields).join(' ');

      return combinedFields.includes(query) || terms.every(term => includesTerm(combinedFields, term));
    })
    .map((item, index) => {
      const fields = searchableFieldsFor(item);
      const score = query
        ? fieldScore(fields.title, query, terms, 80, 12) +
          fieldScore(fields.author, query, terms, 65, 10) +
          fieldScore(fields.category, query, terms, 50, 8) +
          fieldScore(fields.language, query, terms, 45, 8) +
          fieldScore(fields.description, query, terms, 40, 6) +
          fieldScore(fields.transcript, query, terms, 25, 4) +
          fieldScore(fields.date, query, terms, 10, 2)
        : 0;

      return { item, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(result => result.item);
};
