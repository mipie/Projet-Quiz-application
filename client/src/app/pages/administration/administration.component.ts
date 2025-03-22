/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable deprecation/deprecation */
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NEW_ID, TO_CREATE_GAME, TO_MODIFY_GAME } from '@app/constants';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { Match } from '@app/interfaces/match/match';
import { Game, User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { ChannelsService } from '@app/services/channels/channels.service';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { EvaluationService } from '@app/services/evaluation/evaluation.service';
import { ExportService } from '@app/services/export/export.service';
import { GameDataService } from '@app/services/games/game-data.service';
import { IdGeneratorService } from '@app/services/id/id-generator.service';
import { SharedIdService } from '@app/services/id/shared-id.service';
import { ImportService } from '@app/services/import/import.service';
import { LangueService } from '@app/services/langues/langue.service';
import { MatchDataService } from '@app/services/matches/match-data.service';
import { SoundService } from '@app/services/sound/sound.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { take } from 'rxjs';
import { CREATE, DELETE, EXPORT, HISTORIC, IMPORT, LASTMODIFICATION, LISTGAME, MODIFY, NAME, PLAYERS, RESET, SCORE, VISIBILITY } from './constants';

@Component({
    selector: 'app-administration',
    templateUrl: './administration.component.html',
    styleUrls: ['./administration.component.scss'],
})
export class AdministrationComponent implements OnInit, OnDestroy {
    @ViewChild('import') importInput: ElementRef<HTMLInputElement>;
    @ViewChild('export') exportElement: ElementRef<HTMLElement>;
    isAllChecked: boolean = false;
    isAnyChecked: boolean = false;
    selectedTab: string = 'games';
    isOnlyOneChecked: boolean | undefined = undefined;
    games: GameDetails[] = [];
    matches: Match[] = [];
    checkGame: boolean[] = [];
    sortBy: string = 'date';
    sortOrder: string = 'desc';
    currentUser: User | null;
    backgroundImage: string = '';
    createLabel: string = '';
    modifyLabel: string = '';
    deleteLabel: string = '';
    exportLabel: string = '';
    importLabel: string = '';
    listGameLabel: string = '';
    historicLabel: string = '';
    resetLabel: string = '';
    nameLabel: string = '';
    lastModificationLabel: string = '';
    visibilityLabel: string = '';
    playersLabel: string = '';
    scoreLabel: string = '';
    language: string = '';
    evaluationGames: Game[] = [];
    isChatMinimized = false;
    isChatWindow = false;
    isInitialized = false;
    private isAllVisible: boolean = false;
    private router: Router = inject(Router);
    private dialogsService: DialogsService = inject(DialogsService);
    private importService: ImportService = inject(ImportService);
    private exportService: ExportService = inject(ExportService);
    private gameDataService: GameDataService = inject(GameDataService);
    private matchDataService: MatchDataService = inject(MatchDataService);
    private soundService: SoundService = inject(SoundService);
    private authentificationService: AuthService = inject(AuthService);
    private themeService: ThemeService = inject(ThemeService);
    private languageService: LangueService = inject(LangueService);
    private evaluationService: EvaluationService = inject(EvaluationService);
    private channelsService: ChannelsService = inject(ChannelsService);

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
                this.language = language;
                this.updatedLabelLanguage(language);
            });
        }

        this.gameDataService.getData().subscribe(async (response) => {
            this.games = response;
            IdGeneratorService.initialize(this.games);
            for (let i = 0; i < this.games.length; i++) {
                this.checkGame[i] = false;
            }
            const evaluation = await this.evaluationService.getEvaluation().pipe(take(1)).toPromise();
            if (evaluation) {
                this.evaluationGames = evaluation.games;
            }
        });
        this.matchDataService.getData().subscribe((response) => {
            this.matches = response;
            this.toggleSortBy('date');
        });
        setTimeout(() => {
            this.isInitialized = true;
        }, 100);
    }

    updatedLabelLanguage(language: string): void {
        this.createLabel = CREATE[language];
        this.modifyLabel = MODIFY[language];
        this.deleteLabel = DELETE[language];
        this.exportLabel = EXPORT[language];
        this.importLabel = IMPORT[language];
        this.listGameLabel = LISTGAME[language];
        this.historicLabel = HISTORIC[language];
        this.resetLabel = RESET[language];
        this.nameLabel = NAME[language];
        this.lastModificationLabel = LASTMODIFICATION[language];
        this.visibilityLabel = VISIBILITY[language];
        this.playersLabel = PLAYERS[language];
        this.scoreLabel = SCORE[language];
    }

    ngOnDestroy(): void {
        this.onCheck(false);
    }

    directToCreateGame(): void {
        SharedIdService.id = NEW_ID;
        this.router.navigate([TO_CREATE_GAME]);
    }

    directToModifyGame(): void {
        if (this.isOnlyOneChecked) {
            this.clickedButton();
            const index = this.checkGame.findIndex((checkedGame) => checkedGame);
            this.onCheck(false);
            this.gameDataService.getGameById(this.games[index].id).subscribe(async (game: GameDetails) => {
                if (game !== null) {
                    SharedIdService.id = this.games[index].id;
                    this.evaluationService.gameName = game.game.title;
                    this.router.navigate([TO_MODIFY_GAME]);
                } else {
                    if (this.language === 'fra') {
                        await this.dialogsService.openAlertDialog("Le jeu sélectionné n'est plus disponible.<br> Choisissez-en un autre!");
                    } else {
                        await this.dialogsService.openAlertDialog('The selected game is no longer available.<br> Please choose another one!');
                    }
                    this.ngOnInit();
                }
            });
        }
    }

    onCheck(toCheck: boolean): void {
        this.checkGame.fill(toCheck);
        this.isAnyChecked = toCheck;
        this.isOnlyOneChecked = false;
        this.isAllChecked = toCheck;
    }

    changeChecked(index: number): void {
        this.checkGame[index] = !this.checkGame[index];
        this.verifyIfAnyIsChecked();
    }

    verifyIfAnyIsChecked(): boolean {
        this.isAnyChecked = false;
        this.isOnlyOneChecked = undefined;
        for (const each of this.checkGame) {
            if (each) {
                this.isAnyChecked = true;
                this.isOnlyOneChecked = this.isOnlyOneChecked === undefined;
            }
        }
        return this.isAnyChecked;
    }

    setCloseVisibility(game: GameDetails): void {
        game.isVisible = !game.isVisible;
        this.gameDataService.modifyGame(game).subscribe();
    }

    hideAll(): void {
        this.isAllVisible = false;
        if (this.games[0]) this.isAllVisible = this.games[0].isVisible;
        this.games.forEach((each) => {
            each.isVisible = !this.isAllVisible;
            this.gameDataService.modifyGame(each).subscribe();
        });
    }

    selectTab(tab: string) {
        this.selectedTab = tab;
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

    async deleteGame(): Promise<void> {
        if (this.isAnyChecked) {
            this.clickedButton();
            let isConfirmed;
            if (this.language === 'fra') {
                isConfirmed = await this.dialogsService.openYesNoDialog(
                    'Voulez-vous VRAIMENT supprimer ' + (this.isOnlyOneChecked ? 'ce jeu?' : 'ces jeux?'),
                );
            } else {
                isConfirmed = await this.dialogsService.openYesNoDialog(
                    'Do you REALLY want to delete ' + (this.isOnlyOneChecked ? 'this game?' : 'these games?'),
                );
            }

            for (let i = this.games.length - 1; i >= 0; i--) {
                if (this.checkGame[i] && isConfirmed) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    this.gameDataService.deleteGame(this.games[i].id!).subscribe();
                    await this.evaluationService.removedGamesEvaluation(this.games[i].game.title);
                    this.games.splice(i, 1);
                }
            }
            this.onCheck(false);
        }
    }

    async exportGame(): Promise<void> {
        try {
            if (this.isAnyChecked) {
                this.clickedButton();
                for (const i in this.games) {
                    if (this.checkGame[i]) await this.exportService.exportGame(this.exportElement, this.games[i]);
                }
            }
        } catch (error) {
            if (this.language === 'fra') {
                await this.dialogsService.openAlertDialog("Erreur lors de l'exportation,<br>réessayez plus tard.");
            } else {
                await this.dialogsService.openAlertDialog('Error while exporting,<br>try again later.');
            }
        } finally {
            this.onCheck(false);
        }
    }

    async importGame(event: Event): Promise<void> {
        try {
            const gameDetails: GameDetails = await this.importService.importGame(event, this.games);
            if (this.importService.isGameValid) {
                this.games.push(gameDetails);
                this.gameDataService.addGame(gameDetails).subscribe();
                await this.evaluationService.evaluateNewGameAdded(gameDetails.game.title);
                if (this.language === 'fra') {
                    await this.dialogsService.openAlertDialog('Importation réussie !');
                } else {
                    await this.dialogsService.openAlertDialog('Import successful !');
                }
            }
        } catch (error) {
            if (this.language === 'fra') {
                await this.dialogsService.openAlertDialog("Erreur lors de l'importation:<br><br> Fichier JSON Invalide !");
            } else {
                await this.dialogsService.openAlertDialog('Error while importing:<br><br> Invalid JSON file !');
            }
        } finally {
            this.importInput.nativeElement.value = '';
            this.importService.resetIsGameValid();
            this.onCheck(false);
        }
    }

    async resetMatchesHistory(): Promise<void> {
        let isConfirmed;
        if (this.language === 'fra') {
            isConfirmed = await this.dialogsService.openYesNoDialog("Voulez-vous VRAIMENT réinitialiser l'historique?");
        } else {
            isConfirmed = await this.dialogsService.openYesNoDialog('Do you REALLY want to reset historic?');
        }
        if (isConfirmed) {
            this.matchDataService.deleteAllMatches().subscribe();
            this.matches = [];
        }
    }

    toggleSortBy(criteria: string): void {
        if (criteria === 'title') {
            this.matches.sort((a, b) => a.title.localeCompare(b.title));
            this.matches = this.isSortedBy('title', 'asc') ? this.matches.reverse() : this.matches;
            this.sortOrder = this.isSortedBy('title', 'asc') ? 'desc' : 'asc';
            this.sortBy = 'title';
        } else if (criteria === 'date') {
            this.matches.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            if (!this.isSortedBy('date', 'asc')) this.matches.reverse();
            this.sortOrder = this.isSortedBy('date', 'asc') ? 'desc' : 'asc';
            this.sortBy = 'date';
        }
    }

    isSortedBy(criteria: string, order: string): boolean {
        return this.sortBy === criteria && this.sortOrder === order;
    }
}
