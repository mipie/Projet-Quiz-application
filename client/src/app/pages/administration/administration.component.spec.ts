/* eslint-disable max-lines */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdministrationComponent } from './administration.component';
import { AuthService } from '@app/services/auth-guard/auth-service.service';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { ExportService } from '@app/services/export/export.service';
import { GameDataService } from '@app/services/games/game-data.service';
import { ImportService } from '@app/services/import/import.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { TO_CREATE_GAME, TO_MODIFY_GAME } from '@app/constants';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { Question } from '@app/interfaces/question/question';
import { Choice } from '@app/interfaces/choice/choice';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA, ElementRef } from '@angular/core';
import { IdGeneratorService } from '@app/services/id/id-generator.service';
import { SoundService } from '@app/services/sound/sound.service';
import { Match } from '@app/interfaces/match/match';

describe('AdministrationComponent', () => {
    let component: AdministrationComponent;
    let fixture: ComponentFixture<AdministrationComponent>;
    let authService: AuthService;
    let gameDataService: GameDataService;
    let router: Router;
    let songspyService: SoundService;

    const mockGameJSON = {
        id: 0,
        isVisible: false,
        isChecked: false,
        game: {
            id: 0,
            title: 'Sample Game Title',
            $schema: 'sample2.json',
            description: 'dads',
            duration: 20,
            lastModification: new Date(),
            questions: [new Question()],
        },
    };
    const mockGame2 = {
        id: 1,
        isVisible: false,
        isChecked: false,
        game: {
            id: 0,
            title: 'Sample Game Title',
            $schema: 'sample2.json',
            description: 'dads',
            duration: 20,
            lastModification: new Date(),
            questions: [new Question()],
        },
    };
    mockGame2.game.questions[0].choices = [new Choice(), new Choice()];
    mockGameJSON.game.questions[0].choices = [new Choice(), new Choice()];

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [AdministrationComponent],
            providers: [AuthService, GameDataService, DialogsService, ExportService, ImportService, SoundService],
            imports: [HttpClientModule, MatDialogModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(AdministrationComponent);
        component = fixture.componentInstance;
        songspyService = TestBed.inject(SoundService);
        authService = TestBed.inject(AuthService);
        gameDataService = TestBed.inject(GameDataService);
        router = TestBed.inject(Router);

        authService.isPasswordCorrect = true;
        spyOn(songspyService, 'buttonClick').and.returnValue();
        spyOn(gameDataService, 'getData').and.returnValue(of([mockGameJSON]));
        component.ngOnInit();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize checkGame array correctly', () => {
        const initializeSpy = spyOn(IdGeneratorService, 'initialize').and.callThrough();
        component.ngOnInit();
        fixture.detectChanges();
        expect(initializeSpy).toHaveBeenCalledWith(component.games);
        expect(component.checkGame.every((value) => value === false)).toBe(true);
    });

    it('should initialize with correct properties', () => {
        expect(component.isAllChecked).toBe(false);
        expect(component.isAnyChecked).toBe(false);
        expect(component.isOnlyOneChecked).toBe(undefined);
        expect(component.games.length).toBe(1);
        expect(component.checkGame.length).toBe(1);
    });

    it('should call directToCreateGame() and navigate to the create game page', () => {
        const navigateSpy = spyOn(router, 'navigate');
        component.directToCreateGame();
        expect(navigateSpy).toHaveBeenCalledWith([TO_CREATE_GAME]);
    });

    it('should navigate to modify game if only one game is checked', () => {
        component.isOnlyOneChecked = true;
        const checkedGameIndex = 0;
        component.checkGame = Array(component.games.length).fill(false);
        component.checkGame[checkedGameIndex] = true;

        component.games = [mockGameJSON];
        const getGameByIdSpy = spyOn(component['gameDataService'], 'getGameById').and.returnValue(
            of({
                id: 0,
                isVisible: false,
                isChecked: false,
                game: {
                    id: 0,
                    title: 'Sample Game Title',
                    $schema: 'sample2.json',
                    description: 'dads',
                    duration: 20,
                    lastModification: new Date(),
                    questions: [new Question()],
                },
            }),
        );

        const navigateSpy = spyOn(component['router'], 'navigate');
        const openAlertDialogSpy = spyOn(component['dialogsService'], 'openAlertDialog');

        component.directToModifyGame();

        expect(getGameByIdSpy).toHaveBeenCalledWith(0);
        expect(navigateSpy).toHaveBeenCalledWith([TO_MODIFY_GAME]);
        expect(openAlertDialogSpy).not.toHaveBeenCalled();
    });

    it('should show an alert when the selected game is no longer available', () => {
        component.isOnlyOneChecked = true;
        const checkedGameIndex = 0;
        component.checkGame = Array(component.games.length).fill(false);
        component.checkGame[checkedGameIndex] = true;
        component.games = [mockGameJSON];
        const getGameByIdSpy = spyOn(component['gameDataService'], 'getGameById').and.returnValue(of(null as unknown as GameDetails));

        const openAlertDialogSpy = spyOn(component['dialogsService'], 'openAlertDialog');
        const ngOnInitSpy = spyOn(component, 'ngOnInit');
        component.directToModifyGame();

        expect(getGameByIdSpy).toHaveBeenCalledWith(0);
        expect(openAlertDialogSpy).toHaveBeenCalledWith("Le jeu sélectionné n'est plus disponible.<br> Choisissez-en un autre!");
        expect(ngOnInitSpy).toHaveBeenCalled();
    });

    it('should toggle the checked state for a game and update isAnyChecked and isOnlyOneChecked', () => {
        const index = 0;
        component.isAnyChecked = true;
        component.isOnlyOneChecked = true;
        component.checkGame = [true, true, true];

        component.changeChecked(index);

        expect(component.checkGame[index]).toBe(false);
        expect(component.isAnyChecked).toBe(true);
        expect(component.isOnlyOneChecked).toBe(false);
    });

    it('should toggle game visibility and update it on the server', () => {
        const game = new GameDetails();
        game.isVisible = true;

        const modifyGameSpy = spyOn(component['gameDataService'], 'modifyGame').and.returnValue(of(game));

        component.setCloseVisibility(game);
        fixture.detectChanges();

        expect(game.isVisible).toBe(false);
        expect(modifyGameSpy).toHaveBeenCalledWith(game);
    });

    it('should toggle visibility for all games and update them on the server', (done) => {
        component['isAllVisible'] = true;

        const games: GameDetails[] = [new GameDetails(), new GameDetails(), new GameDetails()];

        games.forEach((game) => (game.isVisible = true));
        games[0].isVisible = false;

        const modifyGameSpy = spyOn(component['gameDataService'], 'modifyGame').and.returnValue(of(games[0]));

        component.games = games;
        component.hideAll();

        setTimeout(() => {
            expect(component['isAllVisible']).toBe(false);
            games.forEach((game) => {
                expect(game.isVisible).toBe(true);
                expect(modifyGameSpy).toHaveBeenCalledWith(game);
            });
            done();
        }, 0);
    });

    it('should get match data and sort by date on initialization', (done) => {
        const matches: Match[] = [new Match(), new Match(), new Match()];
        const getDataSpy = spyOn(component['matchDataService'], 'getData').and.returnValue(of(matches));
        const toggleSortBySpy = spyOn(component, 'toggleSortBy');

        component.ngOnInit();

        setTimeout(() => {
            expect(getDataSpy).toHaveBeenCalled();
            expect(component.matches).toEqual(matches);
            expect(toggleSortBySpy).toHaveBeenCalledWith('date');
            done();
        }, 0);
    });

    it('should delete selected games after user confirmation', async () => {
        component.isAnyChecked = true;
        component.isOnlyOneChecked = false;
        component.games[0] = mockGameJSON;
        component.games[1] = mockGame2;
        const numberOfGames = component.games.length;
        const confirmed = true;

        const openYesNoDialogSpy = spyOn(component['dialogsService'], 'openYesNoDialog').and.returnValue(Promise.resolve(confirmed));

        await component.deleteGame();
        fixture.detectChanges();

        expect(openYesNoDialogSpy).toHaveBeenCalledWith('Voulez-vous VRAIMENT supprimer ces jeux?');
        expect(component.games.length - 1).toBe(numberOfGames - 1);
        expect(component.isAnyChecked).toBe(false);
    });

    it('should delete a game when user confirms', async () => {
        component.isAnyChecked = true;
        const gameToDelete = mockGameJSON;

        component.games[0] = gameToDelete;

        const isConfirmed = true;
        spyOn(component['dialogsService'], 'openYesNoDialog').and.returnValue(Promise.resolve(isConfirmed));

        component.checkGame = [true];
        const deleteGameSpy = spyOn(component['gameDataService'], 'deleteGame').and.returnValue(of({}));

        await component.deleteGame();
        fixture.detectChanges();

        expect(deleteGameSpy).toHaveBeenCalledWith(gameToDelete.id);
        expect(component.games).not.toContain(gameToDelete);
        expect(component.isAnyChecked).toBe(false);
    });

    it('should handle export error and show an error dialog', async () => {
        component.isAnyChecked = true;
        component.checkGame = [true, true];
        component.games[0] = mockGame2;
        component.games[1] = mockGameJSON;
        const openAlertDialogSpy = spyOn(component['dialogsService'], 'openAlertDialog');

        await component.exportGame();
        fixture.detectChanges();

        expect(openAlertDialogSpy).toHaveBeenCalledWith("Erreur lors de l'exportation,<br>réessayez plus tard.");
        expect(component.isAnyChecked).toBe(false);
    });

    it('should export selected games successfully', async () => {
        component.isAnyChecked = true;
        component.checkGame = [true, true];
        component.games[0] = mockGame2;
        component.games[1] = mockGameJSON;
        spyOn(component['exportService'], 'exportGame').and.returnValue(Promise.resolve());
        await component.exportGame();
        expect(component['exportService'].exportGame).toHaveBeenCalledTimes(2);
        expect(component['exportService'].exportGame).toHaveBeenCalledWith(component.exportElement, component.games[0]);
        expect(component['exportService'].exportGame).toHaveBeenCalledWith(component.exportElement, component.games[1]);
    });

    it('should import a valid game and handle invalid JSON', async () => {
        component['importService']['isValid'] = true;
        const mockGameDetails: GameDetails = mockGameJSON;
        spyOn(component['importService'], 'importGame').and.returnValue(Promise.resolve(mockGameDetails));

        component.games.push(mockGameDetails);
        const addGameSpy = spyOn(component['gameDataService'], 'addGame').and.returnValue(of(null));

        const openAlertDialogSpy = spyOn(component['dialogsService'], 'openAlertDialog');
        const importInput: ElementRef<HTMLInputElement> = new ElementRef(document.createElement('input'));
        component.importInput = importInput;
        const mockEvent = new Event('input');
        const test = JSON.stringify(mockGameJSON);
        Object.defineProperty(mockEvent, 'target', {
            value: {
                files: [new File([test], 'mock-game.json')],
            },
            writable: false,
        });
        await component.importGame(mockEvent);
        fixture.detectChanges();
        expect(addGameSpy).toHaveBeenCalledWith(mockGameDetails);
        expect(openAlertDialogSpy).toHaveBeenCalledWith('Importation réussie !');
    });

    it('should handle invalid JSON file import and show an error dialog', async () => {
        const error = new Error('Invalid JSON');
        spyOn(component['importService'], 'importGame').and.returnValue(Promise.reject(error));
        const openAlertDialogSpy = spyOn(component['dialogsService'], 'openAlertDialog');
        const importInput: ElementRef<HTMLInputElement> = new ElementRef(document.createElement('input'));
        component.importInput = importInput;
        const mockEvent = new Event('change');
        const test = 'Invalid JSON data';
        Object.defineProperty(mockEvent, 'target', {
            value: {
                files: [new File([test], 'invalid-game.json')],
            },
            writable: false,
        });

        await component.importGame(mockEvent);
        expect(openAlertDialogSpy).toHaveBeenCalledWith("Erreur lors de l'importation:<br><br> Fichier JSON Invalide !");
        expect(component.importInput.nativeElement.value).toBe('');
    });

    it('should delete selected games after user confirmation', async () => {
        component.isAnyChecked = true;
        const gameToDelete = mockGameJSON;
        component.games[0] = gameToDelete;
        component['isOnlyOneChecked'] = true;
        const openYesNoDialogSpy = spyOn(component['dialogsService'], 'openYesNoDialog').and.returnValue(Promise.resolve(true));
        spyOn(component['gameDataService'], 'deleteGame').and.returnValue(of(null));
        await component.deleteGame();
        expect(openYesNoDialogSpy).toHaveBeenCalledWith('Voulez-vous VRAIMENT supprimer ce jeu?');
    });

    it('should change to the selected tab', () => {
        const expectedTab = 'testTab';
        component.selectTab(expectedTab);
        expect(component.selectedTab).toBe(expectedTab);
    });

    it('should reset matches history if confirmed', async () => {
        const deleteAllMatchesSpy = spyOn(component['matchDataService'], 'deleteAllMatches').and.returnValue(of(null));
        const openYesNoDialogSpy = spyOn(component['dialogsService'], 'openYesNoDialog').and.returnValue(Promise.resolve(true));

        await component.resetMatchesHistory();

        expect(openYesNoDialogSpy).toHaveBeenCalledWith("Voulez-vous VRAIMENT réinitialiser l'historique?");
        expect(deleteAllMatchesSpy).toHaveBeenCalled();
        expect(component.matches).toEqual([]);
    });

    it('should not reset matches history if not confirmed', async () => {
        const deleteAllMatchesSpy = spyOn(component['matchDataService'], 'deleteAllMatches').and.returnValue(of(null));
        const openYesNoDialogSpy = spyOn(component['dialogsService'], 'openYesNoDialog').and.returnValue(Promise.resolve(false));

        await component.resetMatchesHistory();

        expect(openYesNoDialogSpy).toHaveBeenCalledWith("Voulez-vous VRAIMENT réinitialiser l'historique?");
        expect(deleteAllMatchesSpy).not.toHaveBeenCalled();
    });

    it('should sort matches by title or date', () => {
        const matches: Match[] = [
            { title: 'B', startDate: new Date('2022-01-02'), numberPlayers: 2, bestScore: 100 },
            { title: 'A', startDate: new Date('2022-01-01'), numberPlayers: 2, bestScore: 100 },
            { title: 'C', startDate: new Date('2022-01-03'), numberPlayers: 2, bestScore: 100 },
        ];
        component.matches = matches;

        component.toggleSortBy('title');
        expect(component.matches).toEqual([
            { title: 'A', startDate: new Date('2022-01-01'), numberPlayers: 2, bestScore: 100 },
            { title: 'B', startDate: new Date('2022-01-02'), numberPlayers: 2, bestScore: 100 },
            { title: 'C', startDate: new Date('2022-01-03'), numberPlayers: 2, bestScore: 100 },
        ]);
        expect(component.sortOrder).toBe('asc');
        expect(component.sortBy).toBe('title');

        component.toggleSortBy('date');
        expect(component.matches).toEqual([
            { title: 'C', startDate: new Date('2022-01-03'), numberPlayers: 2, bestScore: 100 },
            { title: 'B', startDate: new Date('2022-01-02'), numberPlayers: 2, bestScore: 100 },
            { title: 'A', startDate: new Date('2022-01-01'), numberPlayers: 2, bestScore: 100 },
        ]);
        expect(component.sortOrder).toBe('asc');
        expect(component.sortBy).toBe('date');
    });

    it('should reverse matches and set sortOrder to desc if sorted by title in asc order', () => {
        const matches: Match[] = [
            { title: 'A', startDate: new Date('2022-01-01'), numberPlayers: 2, bestScore: 100 },
            { title: 'B', startDate: new Date('2022-01-02'), numberPlayers: 2, bestScore: 100 },
            { title: 'C', startDate: new Date('2022-01-03'), numberPlayers: 2, bestScore: 100 },
        ];
        component.matches = matches;
        spyOn(component, 'isSortedBy').and.returnValue(true);

        component.toggleSortBy('title');

        expect(component.matches).toEqual([
            { title: 'C', startDate: new Date('2022-01-03'), numberPlayers: 2, bestScore: 100 },
            { title: 'B', startDate: new Date('2022-01-02'), numberPlayers: 2, bestScore: 100 },
            { title: 'A', startDate: new Date('2022-01-01'), numberPlayers: 2, bestScore: 100 },
        ]);
        expect(component.sortOrder).toBe('desc');
    });

    it('should set sortOrder to desc if sorted by date in asc order', () => {
        spyOn(component, 'isSortedBy').and.returnValue(true);

        component.toggleSortBy('date');

        expect(component.sortOrder).toBe('desc');
        expect(component.sortBy).toBe('date');
    });

    it('should set sortOrder to asc if not sorted by date in asc order', () => {
        spyOn(component, 'isSortedBy').and.returnValue(false);

        component.toggleSortBy('date');

        expect(component.sortOrder).toBe('asc');
        expect(component.sortBy).toBe('date');
    });

    it('should return true if sorted by given criteria and order', () => {
        component.sortBy = 'date';
        component.sortOrder = 'asc';

        const result = component.isSortedBy('date', 'asc');

        expect(result).toBe(true);
    });

    it('should return false if not sorted by given criteria and order', () => {
        component.sortBy = 'date';
        component.sortOrder = 'desc';

        const result = component.isSortedBy('date', 'asc');

        expect(result).toBe(false);
    });
});
