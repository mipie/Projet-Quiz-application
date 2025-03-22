/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable deprecation/deprecation */
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TO_HOME, TO_LOBBIES, TO_RESULT, WEB_TITLE } from '@app/constants';
import { Game, User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { ChannelsService } from '@app/services/channels/channels.service';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { EvaluationService } from '@app/services/evaluation/evaluation.service';
import { LangueService } from '@app/services/langues/langue.service';
import { ChatService } from '@app/services/room-game/chat.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { SoundService } from '@app/services/sound/sound.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { take } from 'rxjs';
import { ADMINBUTTON, CREATEBUTTON, JOINBUTTON, TEAM, TITLE } from './constants';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent implements OnInit {
    readonly title: string = WEB_TITLE;
    lvlValue: number = 0;
    xpValue: number = 0;
    isChatMinimized = false;
    isChatWindow = false;
    currentUser: User | null;
    backgroundImage: string = '';
    teamLabel: string = '';
    titleLabel: string = '';
    joinButtonLabel: string = '';
    createButtonLabel: string = '';
    adminButtonLabel: string = '';
    evaluationGames: Game[] = [];
    closeDropDownMenu: boolean = false;
    isInitialized = false;
    private router: Router = inject(Router);
    private soundService: SoundService = inject(SoundService);
    private socketUsers: SocketsService = inject(SocketsService);
    private chatService: ChatService = inject(ChatService);
    private authentificationService: AuthService = inject(AuthService);
    private themeService: ThemeService = inject(ThemeService);
    private languageService: LangueService = inject(LangueService);
    private dialogService: DialogsService = inject(DialogsService);
    private currentGameService: CurrentGameService = inject(CurrentGameService);
    private evaluationService: EvaluationService = inject(EvaluationService);
    private channelsService: ChannelsService = inject(ChannelsService);

    async ngOnInit(): Promise<void> {
        this.channelsService.isResults = false;
        this.channelsService.roomCode = '';
        this.channelsService.isOrganisator = false;
        this.channelsService.inGame = false;
        this.currentUser = await this.authentificationService.checkAuthState(TO_HOME);
        if (this.currentUser) {
            this.themeService.currentTheme(this.currentUser).subscribe((theme) => {
                this.backgroundImage = `url(${theme})`;
            });
            this.languageService.currentLanguage(this.currentUser).subscribe((language) => {
                this.updatedLabelLanguage(language);
            });
            this.languageService.language = this.currentUser.language;
        }
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
        await this.setEvaluation();
        this.chatService.resetMessages();
        if (this.socketUsers.isSocketAlive()) this.socketUsers.disconnect();
        this.socketUsers.connect();
        setTimeout(() => {
            this.isInitialized = true;
        }, 100);
    }

    updatedLabelLanguage(language: string): void {
        this.teamLabel = TEAM[language];
        this.titleLabel = TITLE[language];
        this.joinButtonLabel = JOINBUTTON[language];
        this.createButtonLabel = CREATEBUTTON[language];
        this.adminButtonLabel = ADMINBUTTON[language];
    }

    async setEvaluation(): Promise<void> {
        await this.evaluationService.setEvaluation(this.currentUser);
        const evaluation = await this.evaluationService.getEvaluation().pipe(take(1)).toPromise();
        if (evaluation) {
            this.evaluationGames = evaluation.games;
        }
        const games = this.evaluationGames.filter((game) => game.gameName === this.evaluationService.gameName);
        this.evaluationService.getGamesNames();
        if (
            this.currentGameService.previousPage === TO_RESULT &&
            this.evaluationService.gameName &&
            !this.evaluationService.isOrganizer &&
            !games.some((game) => game.uid.includes(this.currentUser?.uid as string))
        ) {
            this.currentGameService.previousPage = '';
            this.dialogService.openEvaluationDialog();
        }
    }

    closeDropDownMenufunction() {
        if (this.closeDropDownMenu) this.closeDropDownMenu = false;
    }

    preventEvent(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
    }

    onDropDownMenuChange(newState: boolean): void {
        this.closeDropDownMenu = newState;
    }

    clickedButton(): void {
        this.soundService.buttonClick();
    }

    logOut(): void {
        this.authentificationService.logout();
    }

    onChatMinimized(isMinimized: boolean) {
        this.isChatMinimized = isMinimized;
    }

    onWindowChange(isWindow: boolean) {
        this.isChatWindow = isWindow;
    }

    async openJoinGame(): Promise<void> {
        this.clickedButton();
        this.router.navigate([TO_LOBBIES]);
    }
}
