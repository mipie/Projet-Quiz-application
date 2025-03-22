/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable deprecation/deprecation */
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { Game, User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { ChannelsService } from '@app/services/channels/channels.service';
import { GameChannelsService } from '@app/services/channels/game-channels.service';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { EvaluationService } from '@app/services/evaluation/evaluation.service';
import { GameDataService } from '@app/services/games/game-data.service';
import { SharedIdService } from '@app/services/id/shared-id.service';
import { LangueService } from '@app/services/langues/langue.service';
import { RankingService } from '@app/services/ranking/ranking.service';
import { RoomService } from '@app/services/room-game/room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { SoundService } from '@app/services/sound/sound.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { take } from 'rxjs';
import { CREATEGAME, DEMOGAME, EVALUATED, RATE, TITLE } from './constants';

@Component({
    selector: 'app-create-play',
    templateUrl: './create-play.component.html',
    styleUrls: ['./create-play.component.scss'],
})
export class CreatePlayComponent implements OnInit {
    gameActive: boolean[] = [];
    data: GameDetails[] = [];
    evaluatedGames: Game[] = [];
    disableBtn: boolean = true;
    currentUser: User | null;
    backgroundImage: string = '';
    createGameLabel: string = '';
    demoGameLabel: string = '';
    titleLabel: string = '';
    rateLabel: string = '';
    evaluatedLabel: string = '';
    isChatMinimized = false;
    isChatWindow = false;
    isInitialized = false;
    private id: number;
    private gameChannelsService: GameChannelsService = inject(GameChannelsService);
    private router: Router = inject(Router);
    private dialogs: DialogsService = inject(DialogsService);
    private socketService: SocketsService = inject(SocketsService);
    private gameDataService: GameDataService = inject(GameDataService);
    private roomService: RoomService = inject(RoomService);
    private soundService: SoundService = inject(SoundService);
    private authentificationService: AuthService = inject(AuthService);
    private themeService: ThemeService = inject(ThemeService);
    private languageService: LangueService = inject(LangueService);
    private rankingService: RankingService = inject(RankingService);
    private evaluationService: EvaluationService = inject(EvaluationService);
    private channelsService: ChannelsService = inject(ChannelsService);

    async ngOnInit(): Promise<void> {
        this.currentUser = await this.authentificationService.getCurrentUser();
        this.socketService.connect();
        this.channelsService.isResults = false;
        this.channelsService.roomCode = '';
        this.channelsService.isOrganisator = false;
        this.channelsService.inGame = false;
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
        if (this.currentUser) {
            this.themeService.currentTheme(this.currentUser).subscribe((theme) => {
                this.backgroundImage = `url(${theme})`;
            });
            this.languageService.currentLanguage(this.currentUser).subscribe((language) => {
                this.updatedLabelLanguage(language);
            });
        }
        if (this.socketService.isSocketAlive()) {
            this.socketService.disconnect();
        }
        this.gameDataService.getData().subscribe(async (response) => {
            this.data = response;
            for (let i = 0; i < this.data.length; i++) {
                this.gameActive[i] = false;
            }
            const evaluation = await this.evaluationService.getEvaluation().pipe(take(1)).toPromise();
            if (evaluation) {
                this.evaluatedGames = evaluation.games;
            }
        });
        setTimeout(() => {
            this.isInitialized = true;
        }, 100);
    }

    updatedLabelLanguage(language: string): void {
        this.createGameLabel = CREATEGAME[language];
        this.demoGameLabel = DEMOGAME[language];
        this.titleLabel = TITLE[language];
        this.evaluatedLabel = EVALUATED[language];
        this.rateLabel = RATE[language];
    }

    ableOptions(id: number, index: number): void {
        this.changeGameActive(index);
        this.accessRankedGames(index);
        if (this.id === undefined || this.gameActive[index]) {
            this.id = id;
            this.roomService.gameName = this.data[index].game.title;
        }
    }

    accessRankedGames(index: number): void {
        if (this.data[index].game.questions.find((question) => question.type !== 'QCM' && question.type !== 'QRE')) {
            this.rankingService.accessRanked = false;
        } else {
            this.rankingService.accessRanked = true;
        }
    }

    navigateTo(route: string): void {
        this.gameDataService.getData().subscribe(async (games) => {
            const selectedGame = games.find((game) => game.id === this.id);
            if (!selectedGame || !selectedGame.isVisible) {
                this.dialogs.openAlertDialog("Ce jeu n'est plus disponible. Veuillez en choisir un autre.");
                this.ngOnInit();
                return;
            }

            let options;
            if (route === 'host') {
                options = await this.dialogs.openGameOptions();
                if (options === undefined) {
                    return;
                }
            }

            SharedIdService.id = this.id;
            if (route === 'host') {
                this.roomService.isHost = true;
                await this.createRoom(options);
                await this.gameChannelsService.createGameChannel(this.roomService.code, this.currentUser);
            }
            this.router.navigate([route]);
        });
        this.clickedButton();
    }

    clickedButton(): void {
        this.soundService.buttonClick();
    }

    onChatMinimized(isMinimized: boolean) {
        this.isChatMinimized = isMinimized;
    }

    onWindowChange(isWindow: boolean) {
        this.isChatWindow = isWindow;
    }

    private async createRoom(options: { creator: string; mode: string; price: number } | undefined): Promise<string> {
        this.roomService.gamePrice = options?.price;
        this.roomService.gameMode = options?.mode;

        return new Promise((resolve) => {
            this.socketService.send('createRoom', { id: SharedIdService.id, options });
            this.socketService.on('gameCreate', (room: string) => {
                this.roomService.code = room;
                resolve(room);
            });
        });
    }

    private changeGameActive(index: number) {
        if (this.gameActive[index]) {
            this.gameActive.fill(false);
            this.disableBtn = true;
        } else {
            this.gameActive.fill(false);
            this.gameActive[index] = !this.gameActive[index];
            this.disableBtn = false;
        }
    }
}
