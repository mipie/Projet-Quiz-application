/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TO_OBSERVER } from '@app/constants';
import { Game } from '@app/interfaces/game/game';
import { Match } from '@app/interfaces/match/match';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { ChannelsService } from '@app/services/channels/channels.service';
import { GameChannelsService } from '@app/services/channels/game-channels.service';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { ExperienceService } from '@app/services/experience/experience.service';
import { LangueService } from '@app/services/langues/langue.service';
import { MatchDataService } from '@app/services/matches/match-data.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { RoomService } from '@app/services/room-game/room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { UsernameService } from '@app/services/username/username.service';
import { WalletService } from '@app/services/wallet/wallet.service';
import {
    CLASSIC,
    CREATOR,
    FRIENDS,
    GAMENAME,
    INPROGRESS,
    INWAITING,
    JOINGAME,
    LEGEND,
    MODE,
    NOGAME,
    NUMBERPLAYERS,
    OBSERVERS,
    PRICE,
    RANKED,
    ROOM,
    STATE,
    TITLE,
    USECODE,
} from './constants';

@Component({
    selector: 'app-lobbies-page',
    templateUrl: './lobbies-page.component.html',
    styleUrls: ['./lobbies-page.component.scss'],
})
export class LobbiesPageComponent implements OnInit {
    games: {
        room: string;
        creator: string;
        name: string;
        mode: string;
        numberOfPlayers: number;
        observers: number;
        price: number;
        state: boolean;
    }[] = [];
    selectedGame:
        | {
            room: string;
            creator: string;
            name: string;
            mode: string;
            numberOfPlayers: number;
            observers: number;
            price: number;
            state: boolean;
        }
        | undefined;
    isChatMinimized = false;
    isChatWindow = false;
    currentUser: User | null;
    backgroundImage: string = '';
    titleLabel: string = '';
    numberLabel: string = '';
    creatorLabel: string = '';
    gameNameLabel: string = '';
    modeLabel: string = '';
    numberPlayersLabel: string = '';
    observersLabel: string = '';
    priceLabel: string = '';
    stateLabel: string = '';
    buttonCodeLabel: string = '';
    legendLabel: string = '';
    rankedLabel: string = '';
    classicLabel: string = '';
    friendsLabel: string = '';
    inwaitingLabel: string = '';
    inprogressLabel: string = '';
    buttonJoinLabel: string = '';
    rankedMessage: string = '';
    nogame: string = '';
    isInitialized: boolean = false;
    isSelectedRoom: boolean = false;
    selectedGameIndex: number | null = null;
    private roomCode: string;
    private socketService: SocketsService = inject(SocketsService);
    private authentificationService: AuthService = inject(AuthService);
    private dialogsService: DialogsService = inject(DialogsService);
    private currentGameService: CurrentGameService = inject(CurrentGameService);
    private room: RoomService = inject(RoomService);
    private router: Router = inject(Router);
    private themeService: ThemeService = inject(ThemeService);
    private languageService: LangueService = inject(LangueService);
    private usernameService: UsernameService = inject(UsernameService);
    private walletService: WalletService = inject(WalletService);
    private experienceService: ExperienceService = inject(ExperienceService);
    private channelsService: ChannelsService = inject(ChannelsService);
    private gameChannelService: GameChannelsService = inject(GameChannelsService);

    async ngOnInit(): Promise<void> {
        this.currentUser = await this.authentificationService.getCurrentUser();
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
            this.usernameService.username(this.currentUser).subscribe((username) => {
                if (this.currentUser) {
                    this.currentUser.username = username;
                }
            });
            this.walletService.currentWallet(this.currentUser).subscribe((wallet) => {
                if (this.currentUser) {
                    this.currentUser.wallet = wallet;
                }
            });
        }
        if (this.socketService.isSocketAlive()) {
            this.socketService.disconnect();
        }
        this.socketService.connect();
        this.getAllRooms();
        setTimeout(() => {
            this.isInitialized = true;
        }, 100);
    }

    updatedLabelLanguage(language: string): void {
        this.nogame = NOGAME[language];
        this.titleLabel = TITLE[language];
        this.numberLabel = ROOM[language];
        this.creatorLabel = CREATOR[language];
        this.gameNameLabel = GAMENAME[language];
        this.modeLabel = MODE[language];
        this.numberPlayersLabel = NUMBERPLAYERS[language];
        this.observersLabel = OBSERVERS[language];
        this.priceLabel = PRICE[language];
        this.stateLabel = STATE[language];
        this.buttonCodeLabel = USECODE[language];
        this.legendLabel = LEGEND[language];
        this.rankedLabel = RANKED[language];
        this.classicLabel = CLASSIC[language];
        this.friendsLabel = FRIENDS[language];
        this.inwaitingLabel = INWAITING[language];
        this.inprogressLabel = INPROGRESS[language];
        this.buttonJoinLabel = JOINGAME[language];
    }

    getAllRooms(): void {
        this.socketService.send('getAllRooms');
        this.socketService.on(
            'actualRooms',
            (
                data: {
                    room: string;
                    creator: string;
                    name: string;
                    mode: string;
                    numberOfPlayers: number;
                    observers: number;
                    price: number;
                    state: boolean;
                }[],
            ) => {
                this.games = data;
            },
        );
    }

    clickedLobby(event: Event, gameId: number): void {
        event.stopPropagation();
        if (this.isSelectedRoom && this.selectedGame === this.games[gameId]) {
            this.buttonJoinLobby();
        }
        this.selectedGame = this.games[gameId];
        this.selectedGameIndex = gameId;
        this.isSelectedRoom = true;
    }

    resetLobby() {
        this.selectedGame = undefined;
        this.selectedGameIndex = null;
        this.isSelectedRoom = false;
    }

    buttonJoinLobby(): void {
        if (this.selectedGame) {
            this.roomCode = this.selectedGame.room;
            this.socketService.send('verifyRoom', this.roomCode);
            this.verifyRoomCode();
        }
    }

    getStateRoom(state: boolean): string {
        return state ? 'fa-lock' : 'fa-unlock';
    }

    onChatMinimized(isMinimized: boolean) {
        this.isChatMinimized = isMinimized;
    }

    onWindowChange(isWindow: boolean) {
        this.isChatWindow = isWindow;
    }

    async buttonJoinCode(): Promise<void> {
        const response = await this.dialogsService.openJoinGame();
        if (response === undefined) return;

        this.roomCode = response.code.trim();
        if (this.roomCode === '') {
            this.openLockedRoom('Le code de la salle ne peut pas être vide.');
            return;
        }
        this.socketService.send('verifyRoom', this.roomCode);
        this.verifyRoomCode();
    }

    private verifyRoomCode(): void {
        this.socketService.on('verifiedCode', async (response: boolean) => {
            if (response === null) {
                this.openLockedRoom("La salle n'existe pas.");
                this.ngOnInit();
            } else if (!response) {
                this.openLockedRoom("La salle a été verrouillée par l'organisateur.");
                this.ngOnInit();
            } else {
                this.selectedGame = this.games.find((game) => game.room === this.roomCode);
                if (this.selectedGame?.price === 0) {
                    this.verifyModeRoom();
                } else {
                    if (this.currentUser && this.selectedGame && this.currentUser?.wallet < this.selectedGame?.price) {
                        this.openNotEnough('Il vous manque les fonds nécessaires pour accéder à la partie.');
                        this.ngOnInit();
                    } else if (this.selectedGame?.mode === 'fa-users' && !this.verifyRoomFriend()) {
                        this.openLockedRoom("Vous n'êtes pas ami avec l'organisateur de la salle.");
                        this.ngOnInit();
                    } else if (this.selectedGame?.mode === 'fa-trophy' && !this.verifyRoomRanked()) {
                        this.openLockedRoom(this.rankedMessage);
                        this.ngOnInit();
                    } else if (this.currentUser && this.selectedGame) {
                        let acceptToPay = true;
                        acceptToPay = await this.openAcceptPay(
                            `Le prix d'entrée est de ${this.selectedGame.price}MT. Souhaitez-vous poursuivre votre action?`,
                        );
                        if (acceptToPay) {
                            this.walletService.payEnterRoom(this.currentUser, this.selectedGame.price);
                            this.verifyModeRoom();
                        } else {
                            this.ngOnInit();
                        }
                    }
                }
            }
        });
        this.enterRoomAsObserver();
    }

    private enterRoomAsObserver(): void {
        this.socketService.on('seeAsObserver', async () => {
            const acceptToObserver = await this.openJoinObserver("Voulez-vous joindre en tant qu'observateur?");
            if (acceptToObserver) {
                this.socketService.send('joinAsObserver', { code: this.roomCode, name: this.currentUser?.username });
                this.socketService.on('goObserved', (game: Game) => {
                    this.currentGameService.setGame(game);
                    if (this.currentUser) {
                        this.room.isHost = false;
                        const match = new Match();
                        match.title = this.currentGameService.title;
                        MatchDataService.currentMatch = match;
                        this.room.name = this.currentUser?.username;
                        this.room.gameMode = this.selectedGame?.mode;
                        this.room.gamePrice = this.selectedGame?.price;
                        this.room.code = this.roomCode;
                        this.gameChannelService.joinGameChannel(this.roomCode, this.currentUser);
                        this.socketService.send('observerSet', this.room.code);
                        this.router.navigate([TO_OBSERVER]);
                    }
                });
            } else {
                this.ngOnInit();
            }
        });
    }

    private enterRoom(): void {
        this.socketService.send('joinGameByName', { code: this.roomCode, name: this.currentUser?.username });

        this.socketService.on('receiveId', (game: Game) => {
            this.currentGameService.setGame(game);
        });
        
        this.socketService.on('nameAdd', (response) => {
            if (response && this.currentUser) {
                this.room.gameName = this.selectedGame?.name;
                this.room.gameMode = this.selectedGame?.mode;
                this.room.gamePrice = this.selectedGame?.price;
                this.room.name = this.currentUser?.username;
                this.gameChannelService.joinGameChannel(this.roomCode, this.currentUser);
                this.router.navigate(['host']);
            } else {
                this.openBanRoom("Vous êtes banni(e) par l'organisateur.");
                this.ngOnInit();
            }
        });
    }

    private verifyRoomFriend(): boolean {
        const modeFriend = this.games.find((game) => game.mode === 'fa-users' && game.room === this.roomCode);
        if (modeFriend) {
            const currentUserFriends = this.currentUser?.friends.map((friend) => friend.username);
            if (currentUserFriends?.includes(modeFriend.creator)) {
                return true;
            }
        }
        return false;
    }

    private verifyRoomRanked(): boolean {
        const minLevel = 5;
        const modeClassed = this.games.find((game) => game.mode === 'fa-trophy' && game.room === this.roomCode);
        if (modeClassed && modeClassed.numberOfPlayers < 2) {
            if (this.currentUser) {
                const playersCurrentLvl = this.experienceService.lvlValue;
                if (playersCurrentLvl >= minLevel) {
                    return true;
                } else {
                    this.rankedMessage = `Vous devez atteindre le niveau 5 pour participer au mode
                    classé. Votre niveau actuel est ${playersCurrentLvl}.`;
                    return false;
                }
            }
        }
        this.rankedMessage = 'Le nombre de joueurs, limité à 2, est déjà atteint dans cette partie classée.';
        return false;
    }

    private verifyModeRoom(): void {
        if (this.selectedGame?.mode === 'fa-users') {
            if (this.verifyRoomFriend()) {
                this.room.code = this.roomCode;
                this.room.isHost = false;
                this.enterRoom();
            } else {
                this.openLockedRoom("Vous n'êtes pas ami avec l'organisateur de la salle.");
                this.ngOnInit();
            }
        } else if (this.selectedGame?.mode === 'fa-trophy') {
            if (this.verifyRoomRanked()) {
                this.room.code = this.roomCode;
                this.room.isHost = false;
                this.enterRoom();
            } else {
                this.openLockedRoom(this.rankedMessage);
                this.ngOnInit();
            }
        } else {
            this.room.code = this.roomCode;
            this.room.isHost = false;
            this.enterRoom();
        }
    }

    private async openLockedRoom(message: string): Promise<boolean> {
        return await this.dialogsService.openRedirectLobbies(message, 'OK!');
    }

    private async openBanRoom(message: string): Promise<boolean> {
        return await this.dialogsService.openRedirectHome(message, 'OK!');
    }

    private async openNotEnough(message: string): Promise<void> {
        await this.dialogsService.openAlertDialog(message);
    }

    private async openAcceptPay(message: string): Promise<boolean> {
        return await this.dialogsService.openYesNoDialog(message);
    }

    private async openJoinObserver(message: string): Promise<boolean> {
        return await this.dialogsService.openYesNoDialog(message);
    }
}
