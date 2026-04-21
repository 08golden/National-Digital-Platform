import { Language, ContentItem, Category } from './types';

// This is a list of all the languages we support in our app.
// Each one has a name, a greeting, and a background image.
export const LANGUAGES: Language[] = [
  {
    id: 'all',
    name: 'All Languages',
    greeting: 'Hello',
    themeColor: 'amber',
    bgImage: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80&w=1920',
    cultureDescription: 'Namibia: Land of the Brave'
  },
  {
    id: 'oshiwambo',
    name: 'Oshiwambo',
    greeting: 'Ongaipi',
    themeColor: 'red',
    bgImage: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&q=80&w=1920',
    cultureDescription: 'The Aawambo people are the largest ethnic group in Namibia.'
  },
  {
    id: 'otjiherero',
    name: 'Otjiherero',
    greeting: 'Tjave',
    themeColor: 'blue',
    bgImage: 'https://images.unsplash.com/photo-1523805081446-ed9a96a2b5d9?auto=format&fit=crop&q=80&w=1920',
    cultureDescription: 'The Ovaherero are known for their distinctive Victorian-style dresses and cattle-herding traditions.'
  },
  {
    id: 'khoekhoegowab',
    name: 'Khoekhoegowab',
    greeting: '!Gâi tses',
    themeColor: 'emerald',
    bgImage: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=1920',
    cultureDescription: 'The Nama and Damara people speak this click language.'
  },
  {
    id: 'silozi',
    name: 'Silozi',
    greeting: 'Lumela',
    themeColor: 'orange',
    bgImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=1920',
    cultureDescription: 'Spoken primarily in the Zambezi region of Namibia.'
  },
  {
    id: 'rukwangali',
    name: 'Rukwangali',
    greeting: 'Moro',
    themeColor: 'yellow',
    bgImage: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&q=80&w=1920',
    cultureDescription: 'The language of the Kavango people along the northern border.'
  }
];

// These are the four types of content we can have in our library.
export const CATEGORIES: Category[] = ['Articles', 'Audio', 'Video', 'Books'];

// This is our "database" of items. In a real app, this would come from a server.
// For now, we use this "Mock" data to show how the app looks with content.
export const MOCK_CONTENT: ContentItem[] = [
  {
    id: '1',
    title: 'History of Etosha',
    category: 'Articles',
    languageId: 'oshiwambo',
    description: 'A deep dive into the history of the Etosha Pan and its significance to the Aawambo people.'
  },
  {
    id: '2',
    title: 'Traditional Herero Music',
    category: 'Audio',
    languageId: 'otjiherero',
    description: 'A collection of folk songs from the Omaheke region, featuring traditional vocal harmonies.'
  },
  {
    id: '3',
    title: 'Damara Storytelling',
    category: 'Video',
    languageId: 'khoekhoegowab',
    description: 'Elders sharing ancient tales around the fire, preserved for future generations.'
  },
  {
    id: '4',
    title: 'Zambezi River Guide',
    category: 'Books',
    languageId: 'silozi',
    description: 'A comprehensive guide to the flora and fauna of the Zambezi, written in Silozi.'
  },
  {
    id: '5',
    title: 'Kavango Woodcarving',
    category: 'Articles',
    languageId: 'rukwangali',
    description: 'The art and technique of traditional woodcarving in the Kavango regions.'
  },
  {
    id: '6',
    title: 'Oshiwambo Proverbs',
    category: 'Books',
    languageId: 'oshiwambo',
    description: 'A collection of wisdom passed down through generations in the form of proverbs.'
  },
  {
    id: '7',
    title: 'The Great Nama Revolt',
    category: 'Articles',
    languageId: 'khoekhoegowab',
    description: 'Historical account of the resistance against colonial forces.'
  },
  {
    id: '8',
    title: 'Otjiherero Language Basics',
    category: 'Books',
    languageId: 'otjiherero',
    description: 'An introductory guide to learning the Otjiherero language.'
  },
  {
    id: '9',
    title: 'Caprivi Wetlands Documentary',
    category: 'Video',
    languageId: 'silozi',
    description: 'Visual exploration of the unique ecosystem in the Zambezi region.'
  },
  {
    id: '10',
    title: 'Kavango Fishing Songs',
    category: 'Audio',
    languageId: 'rukwangali',
    description: 'Rhythmic songs sung by fishermen along the Okavango River.'
  },
  {
    id: '11',
    title: 'Traditional Oshiwambo Cuisine',
    category: 'Articles',
    languageId: 'oshiwambo',
    description: 'Recipes and cultural significance of traditional foods like Mahangu.'
  },
  {
    id: '12',
    title: 'Herero Cattle Culture',
    category: 'Video',
    languageId: 'otjiherero',
    description: 'A documentary on the central role of cattle in Herero society.'
  },
  {
    id: '13',
    title: 'Oshiwambo Wedding Traditions',
    category: 'Video',
    languageId: 'oshiwambo',
    description: 'A visual guide to the traditional wedding ceremonies of the Aawambo people.'
  },
  {
    id: '14',
    title: 'Nama Musical Bow',
    category: 'Audio',
    languageId: 'khoekhoegowab',
    description: 'The unique sounds of the traditional musical bow used by the Nama people.'
  },
  {
    id: '15',
    title: 'Zambezi Basket Weaving',
    category: 'Articles',
    languageId: 'silozi',
    description: 'The intricate patterns and meanings behind traditional basket weaving in the Zambezi.'
  }
];
