import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class RoomService {
    gameName: string | undefined = '';
    gamePrice: number | undefined = 0;
    gameMode: string | undefined = '';
    private gameActive: boolean = false;
    private player: string = '';
    private room: string = '';
    private isOrganizer: boolean = false;

    get activeGame(): boolean {
        return this.gameActive;
    }

    get isHost(): boolean {
        return this.isOrganizer;
    }

    get code(): string {
        return this.room;
    }

    get name(): string {
        return this.player;
    }

    set activeGame(isActive: boolean) {
        this.gameActive = isActive;
    }

    set isHost(isHost: boolean) {
        this.isOrganizer = isHost;
        this.player = isHost ? 'Organisateur' : '';
    }

    set code(code: string) {
        this.room = code;
    }

    set name(name: string) {
        this.player = name;
    }
}
