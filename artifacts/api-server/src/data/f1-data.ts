export type Driver = {
  id: number;
  name: string;
  shortName: string;
  number: number;
  team: string;
  nationality: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  rating: number;
  active: boolean;
  imageUrl: string | null;
  createdAt: string;
};

export type Player = {
  id: number;
  username: string;
  discordTag: string;
  collectionCount: number;
  balance: number;
  status: "active" | "flagged" | "inactive";
  lastActiveAt: string;
  favoriteDriver: string;
};

export type Activity = {
  id: number;
  type: "drop" | "trade" | "player" | "race" | "system";
  title: string;
  detail: string;
  timestamp: string;
  accent: string;
};

export const drivers: Driver[] = [
  {
    id: 1,
    name: "Lando Norris",
    shortName: "NOR",
    number: 4,
    team: "McLaren",
    nationality: "GB",
    rarity: "legendary",
    rating: 94,
    active: true,
    imageUrl: null,
    createdAt: "2026-01-08T09:30:00.000Z",
  },
  {
    id: 2,
    name: "Oscar Piastri",
    shortName: "PIA",
    number: 81,
    team: "McLaren",
    nationality: "AU",
    rarity: "epic",
    rating: 91,
    active: true,
    imageUrl: null,
    createdAt: "2026-01-08T09:32:00.000Z",
  },
  {
    id: 3,
    name: "Charles Leclerc",
    shortName: "LEC",
    number: 16,
    team: "Ferrari",
    nationality: "MC",
    rarity: "legendary",
    rating: 93,
    active: true,
    imageUrl: null,
    createdAt: "2026-01-08T09:34:00.000Z",
  },
  {
    id: 4,
    name: "Max Verstappen",
    shortName: "VER",
    number: 1,
    team: "Red Bull Racing",
    nationality: "NL",
    rarity: "legendary",
    rating: 98,
    active: true,
    imageUrl: null,
    createdAt: "2026-01-08T09:36:00.000Z",
  },
  {
    id: 5,
    name: "George Russell",
    shortName: "RUS",
    number: 63,
    team: "Mercedes",
    nationality: "GB",
    rarity: "rare",
    rating: 88,
    active: true,
    imageUrl: null,
    createdAt: "2026-01-08T09:38:00.000Z",
  },
  {
    id: 6,
    name: "Fernando Alonso",
    shortName: "ALO",
    number: 14,
    team: "Aston Martin",
    nationality: "ES",
    rarity: "epic",
    rating: 90,
    active: true,
    imageUrl: null,
    createdAt: "2026-01-08T09:40:00.000Z",
  },
];

export const players: Player[] = [
  {
    id: 1,
    username: "pitwall_rossi",
    discordTag: "rossi#1204",
    collectionCount: 84,
    balance: 12640,
    status: "active",
    lastActiveAt: "2026-09-14T08:58:00.000Z",
    favoriteDriver: "Lando Norris",
  },
  {
    id: 2,
    username: "sector_one",
    discordTag: "sectorone#9811",
    collectionCount: 61,
    balance: 8940,
    status: "active",
    lastActiveAt: "2026-09-14T08:42:00.000Z",
    favoriteDriver: "Max Verstappen",
  },
  {
    id: 3,
    username: "apexhunter",
    discordTag: "apexhunter#4470",
    collectionCount: 47,
    balance: 5720,
    status: "flagged",
    lastActiveAt: "2026-09-13T22:18:00.000Z",
    favoriteDriver: "Charles Leclerc",
  },
  {
    id: 4,
    username: "monaco_miles",
    discordTag: "miles#6655",
    collectionCount: 39,
    balance: 4200,
    status: "active",
    lastActiveAt: "2026-09-13T21:34:00.000Z",
    favoriteDriver: "Fernando Alonso",
  },
  {
    id: 5,
    username: "late_braker",
    discordTag: "braker#2011",
    collectionCount: 22,
    balance: 1880,
    status: "inactive",
    lastActiveAt: "2026-09-10T12:15:00.000Z",
    favoriteDriver: "George Russell",
  },
];

export const activity: Activity[] = [
  {
    id: 1,
    type: "drop",
    title: "Rare drop claimed",
    detail: "pitwall_rossi pulled a McLaren MCL38 · Epic",
    timestamp: "2026-09-14T08:58:00.000Z",
    accent: "orange",
  },
  {
    id: 2,
    type: "trade",
    title: "Trade completed",
    detail: "sector_one traded 3 cards with monaco_miles",
    timestamp: "2026-09-14T08:46:00.000Z",
    accent: "blue",
  },
  {
    id: 3,
    type: "race",
    title: "Race weekend opened",
    detail: "Singapore GP collection is now live",
    timestamp: "2026-09-14T08:30:00.000Z",
    accent: "red",
  },
  {
    id: 4,
    type: "player",
    title: "New player joined",
    detail: "apexhunter connected from the F1 Fans guild",
    timestamp: "2026-09-14T08:12:00.000Z",
    accent: "green",
  },
  {
    id: 5,
    type: "system",
    title: "Driver sync complete",
    detail: "6 driver records checked against the F1 Dex catalog",
    timestamp: "2026-09-14T07:55:00.000Z",
    accent: "purple",
  },
];

export let dropsPaused = false;

export function toggleDropsPaused() {
  dropsPaused = !dropsPaused;
  return dropsPaused;
}