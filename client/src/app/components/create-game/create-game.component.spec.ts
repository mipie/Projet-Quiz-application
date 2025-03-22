/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { AdministrationComponent } from '@app/pages/administration/administration.component';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { GameDataService } from '@app/services/games/game-data.service';
import { SharedIdService } from '@app/services/id/shared-id.service';
import { ValidateFormService } from '@app/services/verification/validate-form.service';
import { Observable, of } from 'rxjs';
import { NEW_ID, TO_ADMIN, TO_HOME } from '@app/constants';
import { QuestionFormComponent } from '@app/components/question-form/question-form.component';
import { CreateGameComponent } from './create-game.component';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { SoundService } from '@app/services/sound/sound.service';

describe('CreateGameComponent', () => {
    let component: CreateGameComponent;
    let fixture: ComponentFixture<CreateGameComponent>;
    let gameDataService: GameDataService;
    let validateFormService: ValidateFormService;
    let songspyService: SoundService; //
    let router: Router;

    const mockGame: GameDetails = {
        id: -1,
        isVisible: true,
        isChecked: false,
        game: {
            $schema: 'test.json',
            title: 'test',
            description: 'test description.',
            duration: 10,
            lastModification: new Date(),
            questions: [
                {
                    id: 134,
                    type: 'QCM',
                    text: 'Qusetion 1 ?',
                    points: 10,
                    choices: [
                        {
                            id: 114,
                            text: 'Choice 1',
                            isCorrect: true,
                        },
                        {
                            id: 123,
                            text: 'Choice 2',
                            isCorrect: false,
                        },
                    ],
                },
            ],
        },
    };
    const mockGames: GameDetails[] = [
        {
            id: 0,
            isVisible: true,
            isChecked: false,
            game: {
                $schema: 'test.json',
                title: 'test',
                description: 'test description.',
                duration: 10,
                lastModification: '2023-09-11T20:20:39+00:00',
                questions: [
                    {
                        type: 'QCM',
                        text: 'Qusetion 1 ?',
                        points: 10,
                        choices: [
                            {
                                text: 'Choice 1',
                                isCorrect: true,
                            },
                            {
                                text: 'Choice 2',
                                isCorrect: false,
                            },
                        ],
                    },
                    {
                        type: 'QCM',
                        text: 'Question 2 ?',
                        points: 10,
                        choices: [
                            {
                                text: 'Choice A',
                                isCorrect: true,
                            },
                            {
                                text: 'Choice B',
                                isCorrect: false,
                            },
                        ],
                    },
                ],
            },
        },
        {
            id: 1,
            isVisible: true,
            isChecked: false,
            game: {
                $schema: 'test.json',
                title: 'test 2',
                description: 'test description.',
                duration: 10,
                lastModification: '2023-09-11T20:20:39+00:00',
                questions: [
                    {
                        type: 'QCM',
                        text: 'Qusetion 1 ?',
                        points: 10,
                        choices: [
                            {
                                text: 'Choice 1',
                                isCorrect: true,
                            },
                            {
                                text: 'Choice 2',
                                isCorrect: false,
                            },
                        ],
                    },
                ],
            },
        },
    ] as unknown as GameDetails[];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CreateGameComponent, QuestionFormComponent],
            imports: [
                RouterTestingModule.withRoutes([{ path: 'admin', component: AdministrationComponent }]),
                HttpClientTestingModule,
                MatDialogModule,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                GameDataService,
                ValidateFormService,
                DialogsService,
                { provide: SharedIdService, useValue: { id: 42 } },
                { provide: SoundService, useValue: {} },
                SoundService,
            ],
        }).compileComponents();
        gameDataService = TestBed.inject(GameDataService);
        validateFormService = TestBed.inject(ValidateFormService);
        songspyService = TestBed.inject(SoundService);
        router = TestBed.inject(Router);

        spyOn(songspyService, 'buttonClick').and.returnValue();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CreateGameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load a new game', () => {
        component.loadNewGame();
        expect(component.gameDetails).toBeDefined();
        expect(component.gameDetails.game).toBeDefined();
        expect(component.gameDetails.game.questions.length).toBe(1);
        expect(component.gameDetails.game.questions[0].choices?.length).toBe(2);
    });

    it('should initialize allGames with data from gameDataService', fakeAsync(() => {
        spyOn(gameDataService, 'getData').and.returnValue(of(mockGames));
        component.ngOnInit();
        const allGames = (component as any)['allGames'];
        tick();
        expect(allGames).toEqual(mockGames);
    }));

    it('should handle loading a new game', fakeAsync(() => {
        const getGameByIdSpy = spyOn(gameDataService, 'getGameById').and.returnValue(of(null as unknown as GameDetails));
        spyOn(component, 'loadNewGame');
        (component as any).currentGameId = NEW_ID;
        component.ngOnInit();

        tick();
        expect(getGameByIdSpy).toHaveBeenCalled();
        expect(component.loadNewGame).toHaveBeenCalled();
    }));

    it('should handle loading an existing game', fakeAsync(() => {
        const getGameByIdSpy = spyOn(gameDataService, 'getGameById').and.returnValue(of(mockGame));
        (component as any).currentGameId = 1;
        component.ngOnInit();

        tick();
        expect(getGameByIdSpy).toHaveBeenCalledWith(1);
    }));

    it('should navigate to home if currentGameId is undefined', fakeAsync(() => {
        spyOn(gameDataService, 'getGameById').and.returnValue(of(null as unknown as GameDetails));
        spyOn(router, 'navigate');
        (component as any).currentGame = undefined;
        component['currentGameId'] = undefined;
        component.ngOnInit();

        tick();
        expect(router.navigate).toHaveBeenCalledWith([TO_HOME]);
    }));

    it('should return true if game input is valid', () => {
        spyOn(gameDataService, 'getData').and.returnValue(mockGames as unknown as Observable<GameDetails[]>);
        spyOn(validateFormService, 'verifyTitleGame').and.returnValue(null as unknown as string);
        spyOn(validateFormService, 'verifyDescriptionGame').and.returnValue(null as unknown as string);
        spyOn(validateFormService, 'verifyDurationGame').and.returnValue(null as unknown as string);

        let allGames = (component as any)['allGames'];
        allGames = mockGames;
        component.gameDetails = allGames;
        component.childComponent = jasmine.createSpyObj('QuestionFormComponent', ['sendAreQuestionsValid']);
        component.childComponent.sendAreQuestionsValid();

        spyOn(component, 'verifyGameInput').and.returnValue(true);
        const result = component.verifyGameInput();
        expect(result).toBe(true);
    });

    it('should return false if game input is invalid', () => {
        spyOn(gameDataService, 'getData').and.returnValue(mockGames as unknown as Observable<GameDetails[]>);
        spyOn(validateFormService, 'verifyTitleGame').and.returnValue('Title error');
        spyOn(validateFormService, 'verifyDescriptionGame').and.returnValue('Description error');
        spyOn(validateFormService, 'verifyDurationGame').and.returnValue('Duration error');

        let allGames = (component as any)['allGames'];
        allGames = mockGames;
        component.gameDetails = allGames;
        component.childComponent = jasmine.createSpyObj('QuestionFormComponent', ['sendAreQuestionsValid']);
        component.childComponent.sendAreQuestionsValid();

        const result = component.verifyGameInput();

        expect(result).toBe(false);
    });

    it('should save data for a new game', fakeAsync(() => {
        spyOn(component, 'verifyGameInput').and.returnValue(true);
        spyOn(gameDataService, 'getGameById').and.returnValue(of(null as unknown as GameDetails));
        spyOn(gameDataService, 'addGame').and.returnValue(of({}));
        spyOn(gameDataService, 'modifyGame').and.returnValue(of({}));
        spyOn((component as any).router, 'navigate');
        spyOn(component, 'ngOnInit');

        (component as any).currentGameId = NEW_ID;
        component.gameDetails = mockGame;

        component.saveDataGame();

        tick();
        expect(gameDataService.getGameById).toHaveBeenCalledWith(NEW_ID);
        expect(gameDataService.addGame).toHaveBeenCalledWith(mockGame);
        expect(gameDataService.modifyGame).not.toHaveBeenCalled();
        expect((component as any).router.navigate).toHaveBeenCalledWith([TO_ADMIN]);
        expect(component.ngOnInit).toHaveBeenCalled();
    }));

    it('should save data for an existing game', fakeAsync(() => {
        spyOn(component, 'verifyGameInput').and.returnValue(true);
        spyOn(gameDataService, 'getGameById').and.returnValue(of(mockGame));
        spyOn(gameDataService, 'addGame').and.returnValue(of({}));
        spyOn(gameDataService, 'modifyGame').and.returnValue(of({}));
        spyOn((component as any).router, 'navigate');
        spyOn(component, 'ngOnInit');

        (component as any).currentGameId = 1;
        component.gameDetails = mockGame;

        component.saveDataGame();

        tick();
        const value = -1;
        expect(gameDataService.getGameById).toHaveBeenCalledWith(1 * value);
        expect(gameDataService.modifyGame).toHaveBeenCalledWith(mockGame);
        expect(gameDataService.addGame).not.toHaveBeenCalled();
        expect((component as any).router.navigate).toHaveBeenCalledWith([TO_ADMIN]);
        expect(component.ngOnInit).toHaveBeenCalled();
    }));

    it('should not save data for an invalid game', () => {
        spyOn(component, 'verifyGameInput').and.returnValue(false);
        (component as any).currentGameId = 1;
        spyOn(gameDataService, 'getGameById');
        spyOn(gameDataService, 'addGame');
        spyOn(gameDataService, 'modifyGame');
        spyOn((component as any).router, 'navigate');
        spyOn(component, 'ngOnInit');

        component.saveDataGame();

        expect(gameDataService.getGameById).not.toHaveBeenCalled();
        expect(gameDataService.addGame).not.toHaveBeenCalled();
        expect(gameDataService.modifyGame).not.toHaveBeenCalled();
        expect((component as any).router.navigate).not.toHaveBeenCalled();
        expect(component.ngOnInit).not.toHaveBeenCalled();
    });

    it('should validate questions and set areQuestionsValid to true', () => {
        const eventValue = true;
        component.validateQuestions(eventValue);
        expect((component as any).areQuestionsValid).toBeTrue();
    });

    it('should validate questions and set areQuestionsValid to false', () => {
        const eventValue = false;
        component.validateQuestions(eventValue);
        expect((component as any).areQuestionsValid).toBeFalse();
    });

    it('should open a dialog box with a confirmation message', () => {
        spyOn((component as any).dialogs, 'openRedirectionDialog');
        component.cancel();
        expect((component as any).dialogs.openRedirectionDialog).toHaveBeenCalledWith(
            'Voulez-vous vraiment annuler? Vos modifications seront perdues.',
            './admin',
        );
    });

    it('should return true when game input is valid', () => {
        component.childComponent = jasmine.createSpyObj('QuestionFormComponent', ['sendAreQuestionsValid']);
        (component as any).areQuestionsValid = true;
        component.childComponent.sendAreQuestionsValid();
        component.gameDetails = mockGame;
        component.errorMessageTitle = '';
        component.errorMessageDescription = '';
        component.errorMessageDuration = '';
        const result = component.verifyGameInput();
        expect(result).toBeTrue();
    });

    it('should return false when game input is not valid', () => {
        component.childComponent = jasmine.createSpyObj('QuestionFormComponent', ['sendAreQuestionsValid']);
        component.childComponent.sendAreQuestionsValid();
        component.gameDetails = mockGame;
        component.errorMessageTitle = 'Title error';
        component.errorMessageDescription = 'Description error';
        component.errorMessageDuration = 'Duration error';
        const result = component.verifyGameInput();
        expect(result).toBeFalse();
    });

    it('should change focus correctly', () => {
        const mockEvent = { preventDefault: jasmine.createSpy('preventDefault') };
        const mockElement1 = document.createElement('div');
        const mockElement2 = document.createElement('div');
        const mockElement3 = document.createElement('div');

        component.requiredInputList = {
            toArray: () => [{ nativeElement: mockElement1 }, { nativeElement: mockElement2 }, { nativeElement: mockElement3 }],
            length: 3,
        } as any;

        component.childComponent = {
            requiredInputList: {
                toArray: () => [],
                length: 0,
            },
        } as any;

        spyOn(mockElement2, 'focus');

        component.changeFocus(mockEvent as any, mockElement1);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockElement2.focus).toHaveBeenCalled();
    });

    it("should change focus to next component's elements correctly", () => {
        const mockEvent = { preventDefault: jasmine.createSpy('preventDefault') };
        const mockElement1 = document.createElement('div');
        const mockElement2 = document.createElement('div');

        component.requiredInputList = {
            toArray: () => [{ nativeElement: mockElement1 }],
        } as any;

        component.childComponent = {
            requiredInputList: {
                toArray: () => [{ nativeElement: mockElement2 }],
                length: 1,
            },
        } as any;

        spyOn(mockElement2, 'focus');

        component.changeFocus(mockEvent as any, mockElement1);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockElement2.focus).toHaveBeenCalled();
    });
});
