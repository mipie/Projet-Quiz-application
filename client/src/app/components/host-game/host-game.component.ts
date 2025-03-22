/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable deprecation/deprecation */
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Game } from '@app/interfaces/game/game';
import { Match } from '@app/interfaces/match/match';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { AvatarService } from '@app/services/avatars/avatar.service';
import { ChannelsService } from '@app/services/channels/channels.service';
import { GameChannelsService } from '@app/services/channels/game-channels.service';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { EvaluationService } from '@app/services/evaluation/evaluation.service';
import { GameDataService } from '@app/services/games/game-data.service';
import { SharedIdService } from '@app/services/id/shared-id.service';
import { LangueService } from '@app/services/langues/langue.service';
import { MatchDataService } from '@app/services/matches/match-data.service';
import { ChatService } from '@app/services/room-game/chat.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { RoomService } from '@app/services/room-game/room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { SoundService } from '@app/services/sound/sound.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { BehaviorSubject } from 'rxjs';
import { BANNEDNAMES, CODEROOM, GAMEPRICE, GAMETITLE, INVITEPLAYERS, LOCKROOM, ONELOCKROOM, ONEPLAYERLOCK, QUIT, START } from './constants';

@Component({
    selector: 'app-host-game',
    templateUrl: './host-game.component.html',
    styleUrls: ['./host-game.component.scss'],
})
export class HostGameComponent implements OnInit {
    @ViewChild('lock') lockElement: HTMLImageElement;
    disable: boolean = false;
    time: number;
    isGameBegin: boolean = false;
    code: string = '';
    players: { username: string; avatar: string | undefined }[] = [];
    isRoomLocked: boolean = false;
    bannedNames: string[] = [];
    currentUser: User | null;
    backgroundImage: string = '';
    quit: string = '';
    invitePlayers: string = '';
    codeRoom: string = '';
    lockRoom: string = '';
    bannedNamesLabel: string = '';
    onePlayerLock: string = '';
    oneLockRoom: string = '';
    start: string = '';
    titleGame: string = '';
    titlePrice: string = '';
    game: string | undefined = '';
    price: number | undefined = 0;
    mode: string | undefined = '';
    language: string = '';
    isChatMinimized = false;
    isChatWindow = false;
    isInitialized = false;
    private router: Router = inject(Router);
    private room: RoomService = inject(RoomService);
    private dialogs: DialogsService = inject(DialogsService);
    private currentGameService: CurrentGameService = inject(CurrentGameService);
    private soundService: SoundService = inject(SoundService);
    private socketsService: SocketsService = inject(SocketsService);
    private chatService: ChatService = inject(ChatService);
    private gameDataService: GameDataService = inject(GameDataService);
    private authentificationService: AuthService = inject(AuthService);
    private themeService: ThemeService = inject(ThemeService);
    private langugageService: LangueService = inject(LangueService);
    private avatarService: AvatarService = inject(AvatarService);
    private socketService: SocketsService = inject(SocketsService);
    private evaluationService: EvaluationService = inject(EvaluationService);
    private gameChannelsService: GameChannelsService = inject(GameChannelsService);
    private channelsService: ChannelsService = inject(ChannelsService);

    get isOrganizer(): boolean {
        return this.room.isHost;
    }

    async ngOnInit(): Promise<void> {
        this.language = this.langugageService.language;
        this.channelsService.isResults = false;
        this.channelsService.roomCode = this.room.code;
        this.channelsService.isOrganisator = this.room.isHost;
        this.channelsService.inGame = true;
        this.channelsService.currentChannel = '*************' + this.room.code;
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
        this.game = this.room.gameName;
        this.price = this.room.gamePrice;
        this.mode = this.room.gameMode;

        this.currentUser = await this.authentificationService.getCurrentUser();
        if (this.currentUser) {
            this.themeService.currentTheme(this.currentUser).subscribe((theme) => {
                this.backgroundImage = `url(${theme})`;
            });
            this.langugageService.currentLanguage(this.currentUser).subscribe((language) => {
                this.updatedLabelLanguage(language);
            });
        }
        if (!this.room.code) this.router.navigate(['home']);
        else this.code = this.room.code;
        if (this.game) {
            this.evaluationService.gameName = this.game;
            this.evaluationService.isOrganizer = this.isOrganizer;
        }

        if (SharedIdService.id !== undefined && this.isOrganizer) {
            this.gameDataService.getGameById(SharedIdService.id).subscribe((response) => {
                const dataSubject = new BehaviorSubject<Game>(response.game);
                this.currentGameService.setGame(dataSubject.getValue());
            });
        }
        this.chatService.getMessage();
        this.getAllUsers();
        this.waitAnswer();
        this.getTime();
        this.windowInteraction();
        setTimeout(() => {
            this.isInitialized = true;
        }, 100);
    }

    updatedLabelLanguage(language: string): void {
        this.quit = QUIT[language];
        this.invitePlayers = INVITEPLAYERS[language];
        this.codeRoom = CODEROOM[language];
        this.lockRoom = LOCKROOM[language];
        this.bannedNamesLabel = BANNEDNAMES[language];
        this.onePlayerLock = ONEPLAYERLOCK[language];
        this.oneLockRoom = ONELOCKROOM[language];
        this.start = START[language];
        this.titleGame = GAMETITLE[language];
        this.titlePrice = GAMEPRICE[language];
    }

    banPlayer(index: number): void {
        const nameBan = this.players[index].username;
        this.socketsService.send('playerBan', nameBan);
    }

    toggleLock(): void {
        this.socketsService.send('emitToggleLock', { roomCode: this.code, lockState: !this.isRoomLocked });
    }

    organizerBegin(): void {
        this.time = 5;
        this.disable = true;
        this.socketsService.send('startTimer', { startValue: this.time, roomName: this.code });
    }

    buttonClick(): void {
        this.soundService.buttonClick();
    }

    onChatMinimized(isMinimized: boolean) {
        this.isChatMinimized = isMinimized;
    }

    onWindowChange(isWindow: boolean) {
        this.isChatWindow = isWindow;
    }

    async quitGame(): Promise<void> {
        if (await this.dialogs.openGiveUp()) {
            if (this.isOrganizer) {
                this.gameChannelsService.deleteGameChannel(this.code);
            } else {
                this.gameChannelsService.quitGameChannel(this.code, this.currentUser);
            }
            this.socketService.send('quitGame');
        }
    }

    private windowInteraction(): void {
        window.addEventListener('popstate', () => {
            this.room.code = '';
            this.socketsService.send('reloadGame');
        });

        window.addEventListener('beforeunload', () => {
            this.socketsService.send('reloadGame');
        });
    }

    private getAllUsers(): void {
        this.socketsService.send('uploadNames', this.code);
        this.socketsService.on('getUsers', async (playerList: string[]) => {
            this.players = await Promise.all(
                playerList.map(async (username) => {
                    const avatar = await this.avatarService.avatarByUsername(username).toPromise();
                    return { username, avatar };
                }),
            );

            if (this.players.length < 2 && this.isRoomLocked) this.socketsService.send('emitToggleLock');
        });
        this.socketsService.on('getBanned', (playerList: string[]) => {
            this.bannedNames = playerList;
        });
    }

    private getTime() {
        this.socketsService.on('timer', (data: { time: number; pauseState: boolean; panicState: boolean }) => {
            this.isGameBegin = true;
            this.time = data.time;
            if (this.time === 0 && !this.currentGameService.isGameDone) this.beginGame();
        });
    }

    private waitAnswer(): void {
        this.socketsService.on('gotBanned', async () => {
            await this.dialogs.openRedirectHome("Vous avez été banni(e) par l'organisateur!", 'OK!');
        });

        this.socketsService.on('viewToHome', async (hasOrgQuit: boolean) => {
            if (!hasOrgQuit) this.router.navigate(['home']);
            else if (this.isOrganizer) this.router.navigate(['createPlay']);
            else await this.dialogs.openRedirectHome("L'organisateur a quitté la partie.", 'OK!');
        });

        this.socketsService.on('lockToggled', (response: boolean) => {
            this.isRoomLocked = response;
        });
    }

    private beginGame() {
        if (this.isOrganizer) {
            this.socketsService.send('beginGame', this.code);
            this.socketsService.send('stopTimer');
        }
        this.socketsService.on('goToViews', (response: boolean) => {
            this.room.activeGame = true;
            const page = response ? 'organizer' : 'game';
            this.router.navigate([page]);
            this.setUpMatchHistory();
        });
    }

    private setUpMatchHistory(): void {
        const match = new Match();
        match.title = this.currentGameService.title;
        match.startDate = new Date();
        match.numberPlayers = this.players.length - 1;
        MatchDataService.currentMatch = match;
    }
}
