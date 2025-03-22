/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PlayerListComponent } from '@app/components/player-list/player-list.component';
import { TO_HOME } from '@app/constants';
import { HistogramData } from '@app/interfaces/histogramData/histogram-data';
import { User } from '@app/interfaces/user/user';
import { ChannelsService } from '@app/services/channels/channels.service';
import { GameChannelsService } from '@app/services/channels/game-channels.service';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { LangueService } from '@app/services/langues/langue.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { RoomService } from '@app/services/room-game/room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { SoundService } from '@app/services/sound/sound.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { MENU, NEXT, PREVIOUS } from './constants';

@Component({
    selector: 'app-resultats',
    templateUrl: './resultats.component.html',
    styleUrls: ['./resultats.component.scss'],
})
export class ResultatsComponent implements OnInit {
    histogramData: HistogramData[] = [];
    histogramDataIndex = 0;
    isLast: boolean;
    isFirst: boolean;
    currentUser: User | null;
    backgroundImage: string = '';
    previous: string = '';
    next: string = '';
    menu: string = '';
    room: RoomService = inject(RoomService);
    isChatMinimized = false;
    isChatWindow = false;
    isInitialized = false;
    private router: Router = inject(Router);
    private histogramService: HistogramService = inject(HistogramService);
    private soundService: SoundService = inject(SoundService);
    private currentService: CurrentGameService = inject(CurrentGameService);
    private socketUsers: SocketsService = inject(SocketsService);
    private dialogs: DialogsService = inject(DialogsService);
    private themeService: ThemeService = inject(ThemeService);
    private languageService: LangueService = inject(LangueService);
    private gameChannelsService: GameChannelsService = inject(GameChannelsService);
    private channelsService: ChannelsService = inject(ChannelsService);

    get isOrganizer(): boolean {
        return this.room.isHost;
    }

    get questionTitle(): string {
        return this.currentService.question.text;
    }

    get questionIndex(): number {
        return this.currentService.questionIndex;
    }

    get questionPoints(): number {
        return this.currentService.question.points;
    }

    ngOnInit(): void {
        this.backgroundImage = `url(${this.themeService.theme})`;
        this.updatedLabelLanguage(this.languageService.language);
        if (!this.room.code) {
            this.router.navigate(['home']);
        }
        this.channelsService.isResults = true;
        this.channelsService.roomCode = this.room.code;
        this.channelsService.isOrganisator = this.room.isHost;
        this.channelsService.inGame = true;
        if ((window as any).electron) {
            (window as any).electron.setData({
                isResults: this.channelsService.isResults,
                roomCode: this.channelsService.roomCode,
                isOrganisator: this.channelsService.isOrganisator,
                inGame: this.channelsService.inGame,
            });
            (window as any).electron.watchSize((data: any) => {
                this.onChatMinimized(data.isMinimize);
                this.onWindowChange(data.isMaximise);
            });
        }
        this.socketUsers.on('sendHistogram', (histograms: HistogramData[]) => {
            this.histogramData = histograms;
            this.histogramService.updateHistogram(histograms[0]);
            this.currentService.firstHistogram();
            this.setIsLastIsFirst();
        });
        setTimeout(() => {
            this.isInitialized = true;
        }, 100);
    }

    updatedLabelLanguage(language: string): void {
        this.previous = PREVIOUS[language];
        this.next = NEXT[language];
        this.menu = MENU[language];
    }

    nextHistogram(): void {
        this.histogramDataIndex++;
        if (this.histogramDataIndex < this.histogramData.length) {
            this.histogramService.updateHistogram(this.histogramData[this.histogramDataIndex]);
            this.currentService.nextHistogram();
        }
        this.setIsLastIsFirst();
    }

    previousHistogram(): void {
        this.histogramDataIndex--;
        if (this.histogramDataIndex >= 0) {
            this.histogramService.updateHistogram(this.histogramData[this.histogramDataIndex]);
            this.currentService.previousHistogram();
        }
        this.setIsLastIsFirst();
    }

    setIsLastIsFirst(): void {
        this.isLast = this.histogramDataIndex === this.histogramData.length - 1;
        this.isFirst = this.histogramDataIndex === 0;
    }

    buttonClick() {
        this.soundService.buttonClick();
    }

    onChatMinimized(isMinimized: boolean) {
        this.isChatMinimized = isMinimized;
    }

    onWindowChange(isWindow: boolean) {
        this.isChatWindow = isWindow;
    }

    async goToHome(): Promise<void> {
        if (this.languageService.language === 'fra') {
            if (await this.dialogs.openYesNoDialog('Voulez-vous retourner au menu principal ?')) {
                this.router.navigate([TO_HOME]);
                this.gameChannelsService.quitGameChannel(this.room.code, this.currentUser);
            }
        } else {
            if (await this.dialogs.openYesNoDialog('Do you want to return to home page ?')) {
                this.router.navigate([TO_HOME]);
                this.gameChannelsService.quitGameChannel(this.room.code, this.currentUser);
            }
        }
        PlayerListComponent.isGameFinishedHandled = false;
    }
}
