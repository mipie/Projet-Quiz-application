/* eslint-disable max-len */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { DEFAULT_BONUS, DEFAULT_INTERVAL, INTERACTION_INTERVAL, MAX_TEXT_COUNT } from '@app/constants';
import { Choice } from '@app/interfaces/choice/choice';
import { Game } from '@app/interfaces/game/game';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { Question } from '@app/interfaces/question/question';
import { GameDataService } from '@app/services/games/game-data.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { RoomService } from '@app/services/room-game/room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { TimeService } from '@app/services/timer/time.service';
import { of } from 'rxjs';
import SpyObj = jasmine.SpyObj;

describe('PlayAreaComponent', () => {
    let component: PlayAreaComponent;
    let fixture: ComponentFixture<PlayAreaComponent>;
    let timeServiceSpy: SpyObj<TimeService>;
    let gameDataServiceSpy: SpyObj<GameDataService>;
    let routerSpy: SpyObj<Router>;
    let dialogSpy: SpyObj<MatDialog>;
    let socketsServiceSpy: SpyObj<SocketsService>;
    let currentGameServiceSpy: jasmine.SpyObj<CurrentGameService>;
    // let currentGameServiceSpy: CurrentGameService;
    let roomServiceSpy: RoomService;

    beforeEach(() => {
        currentGameServiceSpy = jasmine.createSpyObj('CurrentGameService', ['loadCurrentQuestion']);
        Object.defineProperty(currentGameServiceSpy, 'time', { value: 10, writable: true });
        gameDataServiceSpy = jasmine.createSpyObj('GameDataService', ['getGameById']);
        timeServiceSpy = jasmine.createSpyObj('TimeService', ['startTimer', 'stopTimer']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        // dialogSpy = jasmine.createSpyObj('MatDialog', ['open'], ['afterClosed']);
        socketsServiceSpy = jasmine.createSpyObj('SocketsService', ['on', 'send', 'disconnect']);

        TestBed.configureTestingModule({
            declarations: [PlayAreaComponent],
            providers: [
                { provide: TimeService, useValue: timeServiceSpy },
                { provide: GameDataService, useValue: gameDataServiceSpy },
                { provide: MatDialog, useValue: dialogSpy },
                { provide: Router, useValue: routerSpy },
                { provide: SocketsService, useValue: socketsServiceSpy },
                { provide: CurrentGameService, useValue: currentGameServiceSpy },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            params: { id: 0 },
                        },
                    },
                },
                CurrentGameService,
                RoomService,
                // { provide: DialogsService, useValue: dialogSpy },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        });

        fixture = TestBed.createComponent(PlayAreaComponent);
        currentGameServiceSpy = TestBed.inject(CurrentGameService) as jasmine.SpyObj<CurrentGameService>;
        roomServiceSpy = TestBed.inject(RoomService);
        component = fixture.componentInstance;
        gameDataServiceSpy.getGameById.and.returnValue(
            of({
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
                            text: 'Qusetion 1',
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
                            text: 'Question 2',
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
            } as unknown as GameDetails),
        );
        component['currentGameService'].question = new Question();
        fixture.detectChanges();
    });

    it('should create', () => {
        socketsServiceSpy.on.and.callFake((event: string, callback: any) => {
            callback();
        });
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should navigate to home if game does not exist or is not active', () => {
            currentGameServiceSpy['game'] = undefined;
            roomServiceSpy.activeGame = false;
            component.ngOnInit();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['home']);
        });

        it('should load current question if game exists and is active', () => {
            spyOn(component as any, 'loadCurrentQuestion');
            spyOn(component as any, 'getTime');
            spyOn(component as any, 'isFirst');
            spyOn(component as any, 'waitTimerQuestion');
            spyOn(component as any, 'waitNextQuestion');
            spyOn(component as any, 'waitShowQuestion');
            spyOn(component as any, 'stopWaiting');
            spyOn(component['soundService'], 'playAudio');
            currentGameServiceSpy['game'] = new Game();
            roomServiceSpy.activeGame = true;
            component.ngOnInit();
            // expect(routerSpy.navigate).not.toHaveBeenCalled();
            expect((component as any).loadCurrentQuestion).toHaveBeenCalled();
            expect((component as any).getTime).toHaveBeenCalled();
            expect((component as any).isFirst).toHaveBeenCalled();
            expect((component as any).waitTimerQuestion).toHaveBeenCalled();
            expect((component as any).waitNextQuestion).toHaveBeenCalled();
            expect((component as any).waitShowQuestion).toHaveBeenCalled();
            expect((component as any).stopWaiting).toHaveBeenCalled();
            expect(component['soundService'].playAudio).toHaveBeenCalled();
        });
        afterEach(() => {
            if (component['timeInterval']) {
                clearInterval(component['timeInterval']);
            }
        });
        it('should increment lastInteractionTime and send "interactif" event when interactif is true', fakeAsync(() => {
            component['interactif'] = true;
            component['lastInteractionTime'] = INTERACTION_INTERVAL - 1;
            component.ngOnInit();
            tick(DEFAULT_INTERVAL);
            expect(component['lastInteractionTime']).toEqual(0);
            expect(component['interactif']).toBeFalse();
            expect(socketsServiceSpy.send).toHaveBeenCalledWith('interactif', false);
            discardPeriodicTasks();
        }));
    });

    it('should set isWaiting to false when "stopWaiting" event is received', () => {
        const socketServiceSpy = jasmine.createSpyObj('SocketService', ['on']);
        // eslint-disable-next-line @typescript-eslint/ban-types
        socketServiceSpy.on.and.callFake((event: string, cb: Function) => {
            if (event === 'stopWaiting') {
                cb();
            }
        });
        component['socketService'] = socketServiceSpy;
        component['isWaiting'] = true;
        (component as any).stopWaiting();
        expect(component['isWaiting']).toBeFalse();
    });

    describe('onKeydown', () => {
        it('should call onKeydownNumber if targetElement is not null', () => {
            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            const targetElement = document.createElement('div');
            Object.defineProperty(event, 'target', { value: targetElement });
            spyOn((component as any).gamePlayService, 'onKeydownNumber');
            component.onKeydown(event);
            expect((component as any).gamePlayService.onKeydownNumber).toHaveBeenCalled();
        });

        it('should call finishQuestion when Enter is pressed, isQCM is true, and targetElement.id is not "message-input"', () => {
            const targetElement = { id: 'not-message-input' } as HTMLElement;
            const event = { target: targetElement, key: 'Enter' } as unknown as KeyboardEvent;
            Object.defineProperty(currentGameServiceSpy, 'isQCM', { value: true });
            Object.defineProperty(component, 'isQCM', { get: () => true });
            const finishQuestionSpy = spyOn(component, 'finishQuestion');

            component.onKeydown(event);

            expect(finishQuestionSpy).toHaveBeenCalled();
        });
    });

    describe('onSelected', () => {
        it('should set selectedChoice to the value passed in parameter', () => {
            component.selectedchoices = [true, false];
            component.onSelected(1);
            expect(component.selectedchoices).toEqual([true, true]);
        });
    });

    describe('finishQuestion', () => {
        it('should not finish question when validateAnswer returns false or component is disabled', () => {
            spyOn(component as any, 'validateAnswer').and.returnValue(false);
            component.disable = true;
            component.finishQuestion();
            expect(socketsServiceSpy.send).not.toHaveBeenCalled();
        });

        it('should finish question for QRL type and trim the longAnswer', () => {
            spyOn(component as any, 'validateAnswer').and.returnValue(true);
            component.disable = false;
            currentGameServiceSpy.question = { type: 'QRL' } as Question;
            component.longAnswer = ' Answer ';
            component.finishQuestion();
            expect(socketsServiceSpy.send).toHaveBeenCalledWith('isFinish', 'Answer');
            expect(component.disable).toBeTrue();
        });

        it('should finish question for QCM type and call questionResult', () => {
            spyOn(component as any, 'validateAnswer').and.returnValue(true);
            spyOn(component as any, 'questionResult');
            component.disable = false;
            currentGameServiceSpy.question = { type: 'QCM' } as Question;
            component.finishQuestion();
            expect(socketsServiceSpy.send).toHaveBeenCalledWith('isFinish');
            expect(component['questionResult']).toHaveBeenCalled();
            expect(component.disable).toBeTrue();
        });

        it('should set isWaiting to true when "waitPlayer" is received', () => {
            spyOn(component as any, 'validateAnswer').and.returnValue(true);
            component.disable = false;
            currentGameServiceSpy.question = { type: 'QRL' } as Question;
            component.finishQuestion();
            socketsServiceSpy.on.calls.mostRecent().args[1]('mockArgument');
            expect(component.isWaiting).toBeTrue();
        });
    });

    describe('loadCurrentQuestion', () => {
        it('should set initial states and call loadCurrentQuestion from currentGameService', () => {
            component.question.choices = [new Choice(), new Choice()];
            const timerValue = 30;
            spyOnProperty(currentGameServiceSpy, 'gameExist', 'get').and.returnValue(true);
            spyOn(currentGameServiceSpy, 'loadCurrentQuestion');
            spyOnProperty(currentGameServiceSpy, 'time', 'get').and.returnValue(timerValue);
            (component as any).loadCurrentQuestion();
            expect((component as any).isNext).toBeFalse();
            expect(component.timer).toBe(timerValue);
            expect(component.needBonus).toBeFalse();
            expect(component.question.choices?.length).toBe(2);
            expect(component.disable).toBeFalse();
            expect(currentGameServiceSpy.loadCurrentQuestion).toHaveBeenCalled();
            if (component.question.choices !== undefined) {
                for (let i = 0; i < component.question.choices.length; i++) {
                    expect(component.selectedchoices[i]).toBeFalse();
                }
            }
        });

        describe('showResult', () => {
            it('should update properties, call questionResult, update totalPoints and send "scorePlayer" if isQCM is true and rightAnswer is true', () => {
                Object.defineProperty(currentGameServiceSpy, 'isQCM', { value: true });
                Object.defineProperty(component, 'isQCM', { get: () => true });
                Object.defineProperty(component, 'question', { get: () => ({ points: 10 }) });
                component['rightAnswer'] = true;
                component['needBonus'] = false;
                spyOn(component as any, 'questionResult');
                component['showResult']();
                expect(component['interactif']).toBeFalse();
                expect(component['lastInteractionTime']).toEqual(0);
                expect(component['disable']).toBeTrue();
                expect(component['isShowResult']).toBeTrue();
                expect((component as any).questionResult).toHaveBeenCalled();
                expect(component['totalPoints']).toEqual(component['question'].points);
                expect(socketsServiceSpy.send).toHaveBeenCalledWith('scorePlayer', component['totalPoints']);
            });

            it('should update totalPoints based on needBonus and question.points if isQCM is true and rightAnswer is true', () => {
                Object.defineProperty(currentGameServiceSpy, 'isQCM', { value: true });
                Object.defineProperty(component, 'isQCM', { get: () => true });
                Object.defineProperty(component, 'question', { get: () => ({ points: 10 }) });
                component['rightAnswer'] = true;
                component['needBonus'] = true;
                const initialTotalPoints = component['totalPoints'];
                const expectedTotalPoints = initialTotalPoints + component['question'].points * DEFAULT_BONUS;

                component['showResult']();

                expect(component['totalPoints']).toEqual(expectedTotalPoints);
            });

            it('should update properties, not call questionResult, not update totalPoints and send "scorePlayer" if isQCM is true and rightAnswer is false', () => {
                Object.defineProperty(currentGameServiceSpy, 'isQCM', { value: true });
                Object.defineProperty(component, 'isQCM', { get: () => true });
                Object.defineProperty(component, 'question', { get: () => ({ points: 10 }) });
                component['rightAnswer'] = false;
                component['needBonus'] = false;
                const initialTotalPoints = component['totalPoints'];
                spyOn(component as any, 'questionResult');

                component['showResult']();

                expect(component['interactif']).toBeFalse();
                expect(component['lastInteractionTime']).toEqual(0);
                expect(component['disable']).toBeTrue();
                expect(component['isShowResult']).toBeTrue();
                expect((component as any).questionResult).toHaveBeenCalled();
                expect(component['totalPoints']).toEqual(initialTotalPoints);
                expect(socketsServiceSpy.send).toHaveBeenCalledWith('scorePlayer', component['totalPoints']);
            });
            it('should update properties, not call questionResult, update totalPoints and send "scorePlayer" if isQRL is true', () => {
                Object.defineProperty(currentGameServiceSpy, 'isQRL', { value: true });
                Object.defineProperty(component, 'isQRL', { get: () => true });
                Object.defineProperty(component, 'question', { get: () => ({ points: 10 }) });
                component['answersGrade'] = 50;
                spyOn(component as any, 'questionResult');
                component['showResult']();
                expect(component['interactif']).toBeFalse();
                expect(component['lastInteractionTime']).toEqual(0);
                expect(component['disable']).toBeTrue();
                expect(component['isShowResult']).toBeTrue();
                expect((component as any).questionResult).not.toHaveBeenCalled();
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                expect(component['totalPoints']).toEqual(component['question'].points * (component['answersGrade'] / 100));
                expect(socketsServiceSpy.send).toHaveBeenCalledWith('scorePlayer', component['totalPoints']);
            });

            it('should set choicesIndex to 0 if question.choices does not exist', () => {
                component.question.choices = undefined as any;
                const timerValue = 10;
                spyOnProperty(currentGameServiceSpy, 'gameExist', 'get').and.returnValue(true);
                spyOn(currentGameServiceSpy, 'loadCurrentQuestion');
                spyOnProperty(currentGameServiceSpy, 'time', 'get').and.returnValue(timerValue);
                (component as any).loadCurrentQuestion();
                expect(component['choicesIndex']).toEqual(0);
            });
        });

        describe('setNextQuestion', () => {
            it('should reset flags and increment indexQuestion', () => {
                component['currentGameService'].question = new Question();
                (component as any).isShowResult = true;
                (component as any).isNext = true;
                (component as any).currentGameService.questionIndex = 0;
                spyOn(component as any, 'loadCurrentQuestion');
                (component as any).setNextQuestion();
                expect((component as any).isShowResult).toBeFalse();
                expect((component as any).isNext).toBeFalse();
                expect((component as any).currentGameService.questionIndex).toEqual(1);
                expect((component as any).loadCurrentQuestion).toHaveBeenCalled();
            });
        });

        describe('waitShowQuestion', () => {
            it('should call showResult and update flags when "showQuestion" is received', () => {
                const showResultSpy = spyOn(component, 'showResult' as any);
                socketsServiceSpy.on.and.callFake((eventName: string, callback: any) => {
                    if (eventName === 'showQuestion') {
                        callback();
                    }
                });
                (component as any).waitShowQuestion();
                expect(showResultSpy).toHaveBeenCalled();
                expect(component.isWaiting).toBeFalse();
                expect(component.isWaitingOrganizer).toBeTrue();
                expect(socketsServiceSpy.on).toHaveBeenCalledWith('showQuestion', jasmine.any(Function));
            });

            it('should set answersGrade when "answersGrade" event is received', () => {
                const testGrade = 75;
                const socketServiceSpy = jasmine.createSpyObj('SocketService', ['on']);
                // eslint-disable-next-line @typescript-eslint/ban-types
                socketServiceSpy.on.and.callFake((event: string, cb: Function) => {
                    if (event === 'answersGrade') {
                        cb(testGrade);
                    }
                });
                component['socketService'] = socketServiceSpy;
                (component as any).waitShowQuestion();
                expect(component['answersGrade']).toEqual(testGrade);
            });
        });

        describe('waitTimerQuestion', () => {
            it('should set timer to 3, isNext to true, and isWaitingOrganizer to false when timerShowQuestion event is received', () => {
                component['timer'] = 3;
                socketsServiceSpy.on.and.callFake((event: string, callback: any) => {
                    if (event === 'timerShowQuestion') {
                        callback();
                    }
                });
                component['waitTimerQuestion']();
                expect(component['timer']).toBe(3);
                expect(component['isNext']).toBeTrue();
                expect(component['isWaitingOrganizer']).toBeFalse();
            });
        });

        describe('waitNexQuestion', () => {
            it('should call setNextQuestion when showNextQuestion event is received', () => {
                spyOn(component as any, 'setNextQuestion');
                socketsServiceSpy.on.and.callFake((event: string, callback: any) => {
                    if (event === 'showNextQuestion') {
                        callback();
                    }
                });
                component['waitNextQuestion']();
                expect((component as any).setNextQuestion).toHaveBeenCalled();
            });
        });

        describe('isFirst', () => {
            it('should set needBonus to true when isBonus event is received', () => {
                socketsServiceSpy.on.and.callFake((event: string, callback: any) => {
                    if (event === 'isBonus') {
                        callback();
                    }
                });
                component['isFirst']();
                expect(component['needBonus']).toBeTrue();
            });
        });
    });

    describe('getTime', () => {
        it('should handle timer event', () => {
            const timerData = { time: 0, pauseState: true, panicState: true };
            socketsServiceSpy.on.and.callFake((event, callback) => callback(timerData as any));
            spyOn(component['soundService'], 'stop');
            spyOn(component, 'sendAnswer');

            component.isNext = false;
            currentGameServiceSpy.question = { type: 'QRL' } as Question;
            component.disable = false;
            component['getTime']();

            expect(component.isPaused).toBeTrue();
            expect(component.isPanicMode).toBeFalse();
            expect(component.timer).toEqual(0);
            expect(component['soundService'].stop).toHaveBeenCalled();
            expect(component.sendAnswer).toHaveBeenCalled();
            expect(component.disable).toBeTrue();
            expect(component['interactif']).toBeFalse();
            expect(component['lastInteractionTime']).toEqual(0);
        });

        it('should not send answer when isWaiting is true', () => {
            const timerData = { time: 0, pauseState: true, panicState: true };
            socketsServiceSpy.on.and.callFake((event, callback) => callback(timerData as any));
            spyOn(component['soundService'], 'stop');
            spyOn(component, 'sendAnswer');

            component.isNext = false;
            currentGameServiceSpy.question = { type: 'QRL' } as Question;
            component.disable = false;
            component.isWaiting = true;
            component['getTime']();

            expect(component.sendAnswer).not.toHaveBeenCalled();
        });
    });
    describe('sendAnswer', () => {
        it('should send "(Aucune réponse)" if longAnswer is empty', () => {
            component['longAnswer'] = '';
            component.sendAnswer();
            expect(socketsServiceSpy.send).toHaveBeenCalledWith('answerSend', '(Aucune réponse)');
        });

        it('should send trimmed longAnswer if it is not empty', () => {
            const testAnswer = ' test answer ';
            component['longAnswer'] = testAnswer;
            component.sendAnswer();
            expect(socketsServiceSpy.send).toHaveBeenCalledWith('answerSend', testAnswer.trim());
        });
    });
    describe('valueChange', () => {
        it('should update remainingTextCount, send "interactif" event, and reset lastInteractionTime when valueChange is called', () => {
            const testValue = 'test';
            const expectedRemainingTextCount = MAX_TEXT_COUNT - testValue.length;
            component.valueChange(testValue);
            expect(component.remainingTextCount).toEqual(expectedRemainingTextCount);
            expect(socketsServiceSpy.send).toHaveBeenCalledWith('interactif', true);
            expect(component['interactif']).toBeTrue();
            expect(component['lastInteractionTime']).toEqual(0);
        });
    });
    describe('validateAnswer', () => {
        it('should return true if isQRL is true, longAnswer is not empty, and timer is not 0', () => {
            currentGameServiceSpy.question = { type: 'QRL' } as Question;
            component['longAnswer'] = 'test';
            component['timer'] = 1;
            spyOn(component as any, 'verifyQCMAnswers');
            expect(component['validateAnswer']()).toBeTrue();
            expect((component as any).verifyQCMAnswers).not.toHaveBeenCalled();
        });

        it('should return true if isQCM is true and verifyQCMAnswers returns true', () => {
            currentGameServiceSpy.question = { type: 'QCM' } as Question;
            spyOn(component as any, 'verifyQCMAnswers').and.returnValue(true);
            expect(component['validateAnswer']()).toBeTrue();
        });

        it('should return false if neither condition is met', () => {
            currentGameServiceSpy.question = { type: '' } as Question;
            component['longAnswer'] = '';
            component['timer'] = 0;
            spyOn(component as any, 'verifyQCMAnswers').and.returnValue(false);
            expect(component['validateAnswer']()).toBeFalse();
        });
    });

    describe('verifyQCMAnswers', () => {
        it('should return the result of gamePlayService.isConfirmAnswerSelected', () => {
            const testResult = true;
            component['selectedchoices'] = [true, false];
            component['choicesIndex'] = 1;
            component['timer'] = 1;
            spyOn(component['gamePlayService'], 'isConfirmAnswerSelected').and.returnValue(testResult);
            expect(component['verifyQCMAnswers']()).toEqual(testResult);
        });
    });

    it('should set rightAnswer and send "playerFirst" if rightAnswer is true', () => {
        const testResult = true;
        component['selectedchoices'] = [true];
        component['choicesIndex'] = 1;
        currentGameServiceSpy.question.choices = [new Choice()];
        currentGameServiceSpy.question.choices[0].isCorrect = true;
        spyOn(component['gamePlayService'], 'rightAnswer').and.returnValue(testResult);
        component['questionResult']();
        expect(component['rightAnswer']).toEqual(testResult);
        expect(socketsServiceSpy.send).toHaveBeenCalledWith('playerFirst');
    });

    it('should set rightAnswer and not send "playerFirst" if rightAnswer is false', () => {
        const testResult = false;
        component['selectedchoices'] = [false];
        component['choicesIndex'] = 1;
        currentGameServiceSpy.question.choices = [new Choice()];
        currentGameServiceSpy.question.choices[0].isCorrect = false;
        spyOn(component['gamePlayService'], 'rightAnswer').and.returnValue(testResult);
        component['questionResult']();
        expect(component['rightAnswer']).toEqual(testResult);
        expect(socketsServiceSpy.send).not.toHaveBeenCalled();
    });
});
