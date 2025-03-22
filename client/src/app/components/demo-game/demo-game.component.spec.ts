/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DEFAULT_BONUS, DEFAULT_INTERVAL, MAX_TEXT_COUNT } from '@app/constants';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { Question } from '@app/interfaces/question/question';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { GameDataService } from '@app/services/games/game-data.service';
import { GamePlayService } from '@app/services/games/game-play.service';
import { SharedIdService } from '@app/services/id/shared-id.service';
import { TimeService } from '@app/services/timer/time.service';
import { of } from 'rxjs';
import { DemoGameComponent } from './demo-game.component';
import { SoundService } from '@app/services/sound/sound.service';

describe('DemoGameComponent', () => {
    let component: DemoGameComponent;
    let fixture: ComponentFixture<DemoGameComponent>;
    let mockGameDataService: jasmine.SpyObj<GameDataService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockDialogService: jasmine.SpyObj<DialogsService>;
    let mockTimeService: jasmine.SpyObj<TimeService>;
    let mockGamePlayService: jasmine.SpyObj<GamePlayService>;
    let soundService: jasmine.SpyObj<SoundService>;
    const mockGameJSON: GameDetails = {
        id: 0,
        isVisible: true,
        isChecked: true,
        game: {
            title: '',
            $schema: '',
            description: '',
            duration: 10,
            lastModification: new Date(),
            questions: [
                {
                    id: 0,
                    type: 'QCM',
                    text: '',
                    choices: [
                        {
                            id: 0,
                            text: '',
                            isCorrect: true,
                        },
                    ],
                    points: 10,
                },
                {
                    id: 1,
                    type: 'QCM',
                    text: '',
                    choices: [
                        {
                            id: 0,
                            text: '',
                            isCorrect: true,
                        },
                    ],
                    points: 10,
                },
            ],
        },
    };
    let intevalId: number;

    beforeEach(() => {
        mockGameDataService = jasmine.createSpyObj('GameDataService', ['getGameById']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockDialogService = jasmine.createSpyObj('DialogsService', ['openAlertDialog', 'openGiveUp']);
        mockTimeService = jasmine.createSpyObj('TimeService', ['startTimer', 'stopTimer']);
        mockGamePlayService = jasmine.createSpyObj('GamePlayService', ['isConfirmAnswerSelected', 'rightAnswer', 'onKeydownNumber']);
        soundService = jasmine.createSpyObj('SoundService', ['buttonClick']);

        TestBed.configureTestingModule({
            declarations: [DemoGameComponent],
            providers: [
                { provide: GameDataService, useValue: mockGameDataService },
                { provide: Router, useValue: mockRouter },
                { provide: DialogsService, useValue: mockDialogService },
                { provide: TimeService, useValue: mockTimeService },
                { provide: GamePlayService, useValue: mockGamePlayService },
                { provide: SoundService, useValue: soundService },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DemoGameComponent);
        component = fixture.componentInstance;
        SharedIdService.id = 1;
        mockGameDataService.getGameById.and.returnValue(of(mockGameJSON));
        fixture.detectChanges();
    });

    afterEach(() => {
        clearInterval(intevalId);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize game', () => {
        const questionPoints = 10;
        component.ngOnInit();
        expect(component.questionIndex).toBe(0);
        expect(component.pointQuestion).toBe(questionPoints);
        expect(component.textQuestion).toBe('');
        expect(component.choice).toEqual([{ id: 0, text: '', isCorrect: true }]);
        expect(component.selectedChoice).toEqual([false]);
        expect(component.pointJoueur).toBe(0);
        expect(component.disable).toBe(false);
    });

    it('should not return immediately if isQCM is true and isConfirmAnswerSelected returns true', async () => {
        const mockQuestion = { points: 10, choices: [] };
        const mockQuestionsList = [mockQuestion, { points: 20, choices: [] }];
        mockGamePlayService.isConfirmAnswerSelected.and.returnValue(true);
        mockGamePlayService.rightAnswer.and.returnValue(true);
        spyOn(component as any, 'stopTimer');
        spyOn(component, 'wait').and.returnValue(Promise.resolve());
        spyOn(component as any, 'loadCurrentQuestion');
        Object.defineProperty(component, 'isQCM', { value: true });
        Object.defineProperty(component, 'question', { value: mockQuestion });
        Object.defineProperty(component, 'questionsList', { value: mockQuestionsList });
        component.questionIndex = 0;

        await component.confirmAnswer();

        expect(mockGamePlayService.isConfirmAnswerSelected).toHaveBeenCalled();
        expect(component.questionIndex).toBe(1);
        expect(component['loadCurrentQuestion']).toHaveBeenCalled();
    });

    it('should return immediately if isQCM is true and isConfirmAnswerSelected returns false', async () => {
        mockGamePlayService.isConfirmAnswerSelected.and.returnValue(false);
        Object.defineProperty(component, 'isQCM', { value: true });
        await component.confirmAnswer();

        expect(mockGamePlayService.isConfirmAnswerSelected).toHaveBeenCalled();
    });

    it('should initialize the game correctly', () => {
        const mockGame = {
            questions: [{ id: 1, type: 'type1', text: 'text1', points: 10, choices: [] }],
            duration: 60,
        };
        spyOn(component as any, 'loadCurrentQuestion');
        Object.defineProperty(component, 'game', { value: mockGame });

        (component as any).initializeGame();

        expect(component.questionIndex).toBe(0);
        expect(component.selectedChoice).toEqual([]);
        expect(component.pointJoueur).toBe(0);
        expect(component['questionsList']).toEqual(mockGame.questions);
        expect(component['timer']).toBe(mockGame.duration);
        expect(component['loadCurrentQuestion']).toHaveBeenCalled();
    });

    it('should load current question', () => {
        component.ngOnInit();
        component['loadCurrentQuestion']();
        expect((component as any).question).toBeDefined();
        expect(component.textQuestion).toBe((component as any).question.text);
        expect(component.choice).toEqual((component as any).question.choices);
        expect(component.selectedChoice).toEqual(new Array((component as any).question.choices.length).fill(false));
    });

    it('should load current question for QRL', () => {
        const game: GameDetails = {
            id: 0,
            isVisible: true,
            isChecked: true,
            game: {
                title: '',
                $schema: '',
                description: '',
                duration: 10,
                lastModification: new Date(),
                questions: [
                    {
                        id: 0,
                        type: 'QRL',
                        text: '',
                        points: 10,
                    },
                ],
            },
        };
        component['questionsList'] = game.game.questions;
        component['loadCurrentQuestion']();
        expect((component as any).question).toBeDefined();
        expect(component.textQuestion).toBe((component as any).question.text);
        expect(component.choice).toEqual([]);
        expect(component['choicesIndex']).toBe(0);
    });

    it('should confirm answer for QRL if answer is not empty', () => {
        component.ngOnInit();
        const game: GameDetails = {
            id: 0,
            isVisible: true,
            isChecked: true,
            game: {
                title: '',
                $schema: '',
                description: '',
                duration: 10,
                lastModification: new Date(),
                questions: [
                    {
                        id: 0,
                        type: 'QRL',
                        text: '',
                        choices: [
                            {
                                id: 0,
                                text: '',
                                isCorrect: true,
                            },
                        ],
                        points: 10,
                    },
                ],
            },
        };
        component['game'] = game.game;
        component['question'].type = 'QRL';
        component['loadCurrentQuestion']();
        component.longAnswer = 'answer';
        component.selectedChoice = [true];
        component.confirmAnswer();
        expect(component.pointQuestion).toBe((component as any).question.points);
        expect(component.pointJoueur).toBe(component.pointQuestion);
        expect(component.disable).toBe(true);
        expect(component.needBonus).toBe(false);
    });

    it('should not confirm answer for QRL if answer is empty', () => {
        component.ngOnInit();
        const game: GameDetails = {
            id: 0,
            isVisible: true,
            isChecked: true,
            game: {
                title: '',
                $schema: '',
                description: '',
                duration: 10,
                lastModification: new Date(),
                questions: [
                    {
                        id: 0,
                        type: 'QRL',
                        text: '',
                        choices: [
                            {
                                id: 0,
                                text: '',
                                isCorrect: true,
                            },
                        ],
                        points: 10,
                    },
                ],
            },
        };
        component['game'] = game.game;
        component['question'].type = 'QRL';
        component['loadCurrentQuestion']();
        component.longAnswer = '';
        component.selectedChoice = [true];
        spyOn(component as any, 'stopTimer');
        component.confirmAnswer();
        expect(component['stopTimer']).not.toHaveBeenCalled();
    });

    it('should open abandon dialog', async () => {
        mockDialogService.openGiveUp.and.returnValue(Promise.resolve(true));
        await component.openAbandonDialog();
        expect(component['router'].navigate).toHaveBeenCalledWith(['createPlay']);
    });

    it('should call gamePlayService.onKeydownNumber with the correct arguments when onKeydown is called', () => {
        mockGamePlayService.onKeydownNumber.and.returnValue();
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        Object.defineProperty(event, 'target', { value: document.createElement('div'), enumerable: true });

        component.onKeydown(event);

        expect(mockGamePlayService.onKeydownNumber).toHaveBeenCalledWith(event, component.selectedChoice, component['choicesIndex']);
    });

    it('should not call confirmAnswer when the target element id is message-input', () => {
        spyOn(component, 'confirmAnswer');
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        const targetElement = document.createElement('div');
        Object.defineProperty(event, 'target', { value: targetElement, enumerable: true });
        if (event.target instanceof HTMLElement) {
            event.target.id = 'message-input';
        }

        component.onKeydown(event);

        expect(component.confirmAnswer).not.toHaveBeenCalled();
    });

    it('should call getGameById if SharedIdService.id is not undefined', () => {
        SharedIdService.id = 0;
        mockGameDataService.getGameById.and.returnValue(of(mockGameJSON));
        component.ngOnInit();
        expect(mockGameDataService.getGameById).toHaveBeenCalledWith(0);
    });

    it('should navigate to home if SharedIdService.id is undefined', () => {
        SharedIdService.id = undefined;
        mockRouter.navigate.and.returnValue(Promise.resolve(true));
        component.ngOnInit();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['home']);
    });

    it('should call timerFinish every DEFAULT_INTERVAL milliseconds', fakeAsync(() => {
        spyOn(component as any, 'timerFinish');
        component.ngOnInit();
        tick(DEFAULT_INTERVAL);
        expect(component['timerFinish']).toHaveBeenCalled();
        discardPeriodicTasks();
    }));

    it('should call confirmAnswer when the target element id is not message-input, the key is Enter, and disable is false', () => {
        spyOn(component, 'confirmAnswer');
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        Object.defineProperty(event, 'target', { value: document.createElement('div'), enumerable: true });
        component.disable = false;

        component.onKeydown(event);

        expect(component.confirmAnswer).toHaveBeenCalled();
    });

    it('should handle selected choice', () => {
        component.ngOnInit();
        component['loadCurrentQuestion']();
        component.onSelected(0);
        expect(component.selectedChoice[0]).toBe(true);
    });

    it('should call timeService.startTimer with the correct argument when startTimer is called', () => {
        mockTimeService.startTimer.and.returnValue();
        component['timer'] = 10;

        component['startTimer']();

        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(mockTimeService.startTimer).toHaveBeenCalledWith(10);
    });

    it('should return to home', () => {
        SharedIdService.id = undefined;
        component.ngOnInit();
        expect(component['router'].navigate).toHaveBeenCalledWith(['home']);
    });

    it('should do nothing when nothing is selected', () => {
        const questionPoints = 10;
        component.ngOnInit();
        component['loadCurrentQuestion']();
        component.confirmAnswer();
        expect(component.pointQuestion).toBe(questionPoints);
        expect(component.needBonus).toBe(false);
    });

    it('should confirm answer and navigate to createPlay if on last question', fakeAsync(() => {
        Object.defineProperty(component, 'isQCM', { value: true });
        Object.defineProperty(component, 'isQRL', { value: false });
        component['question'] = { points: 10 } as Question;
        component['questionsList'] = [component['question']];
        component.selectedChoice = [false];
        component['choicesIndex'] = 0;
        component.disable = false;
        mockTimeService['time'] = 10;
        mockGamePlayService.isConfirmAnswerSelected.and.returnValue(true);
        mockGamePlayService.rightAnswer.and.returnValue(true);
        spyOn(component as any, 'stopTimer');
        spyOn(component, 'wait').and.returnValue(Promise.resolve());
        mockRouter.navigate.and.returnValue(Promise.resolve(true));

        component.confirmAnswer();
        tick();

        expect(component.needBonus).toBe(true);
        expect(component.pointJoueur).toBe(component['question'].points * DEFAULT_BONUS);
        expect(component.disable).toBe(true);
        expect(component['stopTimer']).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['createPlay']);
    }));

    it('should handle timer finish', fakeAsync(() => {
        component.ngOnInit();
        component['startTimer']();
        mockTimeService['time'] = 0;
        component.disable = false;
        spyOn(component, 'confirmAnswer');
        (component as any).timerFinish();
        expect(component.confirmAnswer).toHaveBeenCalled();
        discardPeriodicTasks();
    }));

    it('should update remainingTextCount when input value changes', () => {
        component.ngOnInit();
        const initialValue = MAX_TEXT_COUNT;
        const newValue = 50;
        component.remainingTextCount = initialValue;
        component.valueChange('a'.repeat(MAX_TEXT_COUNT - newValue));
        expect(component.remainingTextCount).toBe(newValue);
    });

    it('should play sound for a button clicked', () => {
        component.buttonClick();
        expect(soundService.buttonClick).toHaveBeenCalled();
    });
});
