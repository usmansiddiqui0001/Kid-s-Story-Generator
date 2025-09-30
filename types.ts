
export enum Topic {
  Honesty = "Honesty",
  Kindness = "Kindness",
  Friendship = "Friendship",
  Teamwork = "Teamwork",
  Courage = "Courage",
  Patience = "Patience",
  Sharing = "Sharing",
  Forgiveness = "Forgiveness",
  Respect = "Respect",
  Responsibility = "Responsibility",
  Perseverance = "Perseverance",
  Generosity = "Generosity",
}
export enum Language {
  English = "English",
  Hindi = "Hindi",
  Spanish = "Spanish",
  French = "French",
  German = "German",
  Mandarin = "Mandarin",
  Bilingual = "Bilingual (English + Hindi)",
}

export enum VoiceStyle {
  CartoonGirl = "Cartoon Girl",
  CartoonBoy = "Cartoon Boy",
  Fairy = "Fairy Voice",
  FriendlyAnimal = "Friendly Animal Voice",
}

export interface StoryPart {
  paragraph: string;
  imageUrl: string;
}