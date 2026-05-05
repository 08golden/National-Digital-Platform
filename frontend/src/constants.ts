import { Language, ContentItem, Category, User } from './types';

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

// Initial set of users for the platform.
export const INITIAL_USERS: User[] = [
  {
    id: 'admin_1',
    email: 'admin@namibia.org',
    name: 'Platform Administrator',
    role: 'admin',
    status: 'approved',
    createdAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'user_1',
    email: 'scholar@edu.na',
    name: 'John Doe',
    role: 'user',
    status: 'approved',
    intent: 'I am conducting research on northern Namibian dialects.',
    createdAt: new Date().toISOString()
  }
];

// This is our "database" of items. In a real app, this would come from a server.
// For now, we use this "Mock" data to show how the app looks with content.
export const MOCK_CONTENT: ContentItem[] = [
  {
    id: '1',
    title: 'Oshiwambo Oral Traditions: The Epupa Falls Legends',
    category: 'Audio',
    languageId: 'oshiwambo',
    description: 'A collection of oral histories recorded near the Epupa Falls, detailing the spiritual significance of the water for the Himba and Zemba people.',
    thumbnail: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&q=80&w=300',
    author: 'Elder M. Kambonde',
    duration: '12:45',
    date: 'January 2024',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    transcript: 'Welcome to this recording of the Epupa Falls legends. These falls are not just a geographical feature, but a living ancestor. The mist rising from the falls is said to be the breath of the spirits...'
  },
  {
    id: '2',
    title: 'Traditional Herero Praise Songs (Omitandu)',
    category: 'Audio',
    languageId: 'otjiherero',
    description: 'A collection of folk songs from the Omaheke region, featuring traditional vocal harmonies and cattle praise poetry.',
    author: 'Samuel Maharero Choir',
    duration: '08:15',
    date: 'December 2023',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    transcript: 'The Omitandu is a form of poetry and song that celebrates the ancestry and achievements of individuals and their lineages. In this recording, we hear the praises of the great herds of the East...'
  },
  {
    id: '3',
    title: 'The Phonology of Khoekhoegowab Clicks',
    category: 'Articles',
    languageId: 'khoekhoegowab',
    description: 'A deep linguistic analysis of the four primary click sounds and their releases in the Nama language.',
    author: 'Dr. L. Nama',
    date: 'March 2024',
    transcript: 'Khoekhoegowab is famous for its intricate system of click consonants. There are four primary click types used in this language: dental, alveolar, lateral, and palatal. Each one carries a unique semantic weight...'
  },
  {
    id: '4',
    title: 'Zambezi River Guide: Flora and Fauna',
    category: 'Books',
    languageId: 'silozi',
    description: 'A comprehensive guide to the unique ecosystem of the Zambezi region, preserved in the Silozi language.',
    thumbnail: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=300',
    author: 'Prof. S. Mukalani',
    date: 'February 2024',
    transcript: 'The Zambezi region represents one of the most biodiverse areas in Namibia. This book catalogs over 400 species of birds and mammals found along the river banks...'
  },
  {
    id: '5',
    title: 'Kavango Woodcarving Techniques',
    category: 'Video',
    languageId: 'rukwangali',
    description: 'Visual documentation of the traditional woodcarving process in the Kavango regions.',
    author: 'Kavango Arts Collective',
    duration: '15:20',
    date: 'January 2024'
  }
];
