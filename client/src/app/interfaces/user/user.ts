/* eslint-disable max-classes-per-file */
import { Timestamp } from '@angular/fire/firestore';

export interface User {
    username: string;
    email: string;
    uid: string;
    friends: UserInfo[];
    requests: UserInfo[];
    historic: Timestamp[];
    createdChannels: UserChannel[];
    joinedChannels: UserChannel[];
    avatar: Avatar;
    theme: Theme;
    language: string;
    statistics: Statistics;
    gamesHistoric: GamesHistoric[];
    wallet: number;
    experience: number;
    rankingPoints: number;
    rankingW: number;
    rankingL: number;
    rankingD: number;
}

export interface UserChannel {
    title: string;
    lastMessageSeen: Timestamp | null;
}

export class UserInfo {
    username: string;
    uid: string;
}

export class Avatar {
    currentAvatar: string;
    availableAvatars: string[];
}

export class Theme {
    currentTheme: string;
    availableThemes: string[];
}

export class Statistics {
    gamesP: number;
    gamesW: number;
    gamesL: number;
    averageGoodAnsPerGame: number;
    averageTimePerGame: number;
}

export class GamesHistoric {
    gameName: string;
    date: Timestamp;
    isWinner: boolean;
}

export class Evaluation {
    games: Game[];
}

export class Game {
    gameName: string;
    averageRating: number;
    uid: string[];
}
