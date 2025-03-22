/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Question } from '@app/interfaces/question/question';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { SharedIdService } from '@app/services/id/shared-id.service';
import { MatchDataService } from '@app/services/matches/match-data.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { RoomService } from '@app/services/room-game/room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { SoundService } from '@app/services/sound/sound.service';
import { of } from 'rxjs';
import { OrganizerPageComponent } from './organizer-page.component';

describe('OrganizerPageComponent', () => {
    let component: OrganizerPageComponent;
    let fixture: ComponentFixture<OrganizerPageComponent>;
    let routerSpy: Router;
    let socketsServiceSpy: jasmine.SpyObj<SocketsService>;
    let currentGameServiceSpy: jasmine.SpyObj<CurrentGameService>;
    let dialogsServiceSpy: jasmine.SpyObj<DialogsService>;
    let roomServiceSpy: jasmine.SpyObj<RoomService>;
    let histogramServiceSpy: jasmine.SpyObj<HistogramService>;
    let soundServiceSpy: jasmine.SpyObj<SoundService>;
    let matchDataServiceSpy: jasmine.SpyObj<MatchDataService>;

    const expectedData = {
        time: 0,
        pauseState: false,
        panicState: false,
    };

    beforeEach(async () => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        socketsServiceSpy = jasmine.createSpyObj('SocketsService', ['on', 'send']);
        currentGameServiceSpy = jasmine.createSpyObj('CurrentGameService', [
            'loadCurrentQuestion',
            'showResultQuestion',
            'setNextQuestion',
            'timerNextQuestion',
            'isQCM',
            'isQRL',
            'isLast',
        ]);
        dialogsServiceSpy = jasmine.createSpyObj('DialogsService', ['openRedirectHome', 'openGiveUp']);
        roomServiceSpy = jasmine.createSpyObj('RoomService', ['isHost']);
        histogramServiceSpy = jasmine.createSpyObj('HistogramService', ['sumGrade']);
        soundServiceSpy = jasmine.createSpyObj('SoundService', ['buttonClick', 'playAudio', 'stop']);
        matchDataServiceSpy = jasmine.createSpyObj('MatchDataService', ['addMatch']);

        TestBed.configureTestingModule({
            declarations: [OrganizerPageComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: SocketsService, useValue: socketsServiceSpy },
                { provide: CurrentGameService, useValue: currentGameServiceSpy },
                { provide: DialogsService, useValue: dialogsServiceSpy },
                { provide: RoomService, useValue: roomServiceSpy },
                { provide: HistogramService, useValue: histogramServiceSpy },
                { provide: SoundService, useValue: soundServiceSpy },
                { provide: MatchDataService, useValue: matchDataServiceSpy },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(OrganizerPageComponent);
        component = fixture.componentInstance;
        SharedIdService.id = 1;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('getters', () => {
        it('should return question from currentGameService', () => {
            currentGameServiceSpy.question = {} as Question;
            expect(component.question).toEqual({} as Question);
        });

        it('should return questionIndex from currentGameService', () => {
            currentGameServiceSpy.questionIndex = 0;
            expect(component.questionIndex).toEqual(0);
        });

        it('should return isLast from currentGameService', () => {
            currentGameServiceSpy['isEnding'] = true;
            expect(component.isLast).toBeTruthy();
        });

        it('should return isQCM from currentGameService', () => {
            currentGameServiceSpy.question = { type: 'QCM' } as Question;
            expect(component.isQCM).toBeTruthy();
        });

        it('should return isQRL from currentGameService', () => {
            currentGameServiceSpy.question = { type: 'QRL' } as Question;
            expect(component.isQRL).toBeTruthy();
        });
    });

    describe('ngOnInit', () => {
        it('should navigate to home if SharedIdService.id is undefined', () => {
            SharedIdService.id = undefined;
            component.ngOnInit();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['createPlay']);
        });

        it('should load the current question and set up listeners if SharedIdService.id is defined', fakeAsync(() => {
            SharedIdService.id = 2;
            component.ngOnInit();
            expect(currentGameServiceSpy.loadCurrentQuestion).toHaveBeenCalled();
            expect(socketsServiceSpy.send).toHaveBeenCalledWith('startedGame');
            expect(socketsServiceSpy.send).toHaveBeenCalledWith('didAllGiveUp');
            discardPeriodicTasks();
        }));
    });

    describe('activatePanicMode', () => {
        it("should activate panic mode, send the event and play the sound if QCM's time is reached", () => {
            spyOn(component, 'isPanicQCM').and.returnValue(true);
            component.activatePanicMode();
            expect(component.isPanicMode).toBeTrue();
            expect(socketsServiceSpy.send).toHaveBeenCalledWith('panicTimer', component.time);
            expect(soundServiceSpy.playAudio).toHaveBeenCalled();
        });

        it("should activate panic mode, send the event and play the sound if QRL's time is reached", () => {
            spyOn(component, 'isPanicQRL').and.returnValue(true);
            component.activatePanicMode();
            expect(component.isPanicMode).toBeTrue();
            expect(socketsServiceSpy.send).toHaveBeenCalledWith('panicTimer', component.time);
            expect(soundServiceSpy.playAudio).toHaveBeenCalled();
        });
    });

    describe('isPanicQCM/QRL', () => {
        it("should verify if QCM's time is reached", () => {
            Object.defineProperty(currentGameServiceSpy, 'isQCM', { value: true });
            spyOn(component, 'isTimeValue').and.returnValue(true);
            const actualResult = component.isPanicQCM();
            expect(actualResult).toBeTrue();
        });

        it("should verify if QRL's time is reached", () => {
            currentGameServiceSpy.question = { type: 'QCM' } as Question;
            spyOn(component, 'isTimeValue').and.returnValue(true);
            const actualResult = component.isPanicQRL();
            expect(actualResult).toBeTrue();
        });
    });

    it('should verify if time is reached', () => {
        const mockTime = 20;
        component.time = 10;
        component.isNext = false;
        const actualResult = component.isTimeValue(mockTime);
        expect(actualResult).toBeTrue();
    });

    it('should toggle pause/play', () => {
        component.isPaused = false;
        component.togglePausePlay();
        expect(component.isPaused).toBeTrue();
        expect(socketsServiceSpy.send).toHaveBeenCalledWith('pauseTimer');
    });

    it('should set properties correctly and call timerNextQuestion on currentGameService', () => {
        component.timerNextQuestion();
        expect(component.disable).toBeTrue();
        expect(component.isAllFinish).toBeFalse();
        expect(component['isNext']).toBeTrue();
        expect(currentGameServiceSpy.timerNextQuestion).toHaveBeenCalled();
    });

    it('should send usersToResult message and navigate to result', () => {
        roomServiceSpy.isHost = true;
        currentGameServiceSpy.isGameDone = false;
        matchDataServiceSpy.addMatch.and.callFake(() => {
            return of();
        });
        component.usersToResult();
        expect(matchDataServiceSpy.addMatch).toHaveBeenCalledWith(MatchDataService.currentMatch);
        expect(currentGameServiceSpy.isGameDone).toBeTrue();
        expect(socketsServiceSpy.send).toHaveBeenCalledWith('resultEndingGame');
        expect(routerSpy.navigate).toHaveBeenCalledWith(['result']);
    });

    describe('evaluateQRLAnswer', () => {
        it("should autoevaluate all empty answers and show results if it's the last answer evaluated", () => {
            component.answers = [{ playerName: 'playerName', answer: '(Aucune réponse)' }];
            const expectedIndex = 0;
            const expectedScore = 0;
            spyOn(component, 'autoevaluateEmptyAnswers').and.callFake(() => {
                component.answers = [];
            });
            spyOn(component as any, 'showQuestionResults');

            component.evaluateQRLAnswer(expectedIndex, expectedScore);

            expect(component.autoevaluateEmptyAnswers).toHaveBeenCalledWith(expectedScore);
            expect(component['showQuestionResults']).toHaveBeenCalled();
        });

        it("should evaluate answer if it's not empty", () => {
            const mockAnswer1 = { playerName: 'playerName1', answer: 'answer1' };
            const mockAnswer2 = { playerName: 'playerName2', answer: 'answer2' };
            component.answers = [mockAnswer1, mockAnswer2];

            const expectedIndex = 0;
            const expectedScore = 100;
            const expectedRoomCode = roomServiceSpy.code;

            component.evaluateQRLAnswer(expectedIndex, expectedScore);

            expect(histogramServiceSpy.sumGrade).toHaveBeenCalledWith(expectedScore);
            expect(socketsServiceSpy.send).toHaveBeenCalledWith('answerEvaluated', {
                playersName: mockAnswer1.playerName,
                room: expectedRoomCode,
                grade: expectedScore,
            });
            expect(component.answers.length).toEqual(1);
        });
    });

    it('should filter all empty answers and send grade', () => {
        const mockAnswer = { playerName: 'playerName', answer: '(Aucune réponse)' };
        component.answers = [mockAnswer];
        const expectedScore = 100;
        const expectedRoomCode = roomServiceSpy.code;

        component.autoevaluateEmptyAnswers(expectedScore);

        expect(histogramServiceSpy.sumGrade).toHaveBeenCalledWith(expectedScore);
        expect(socketsServiceSpy.send).toHaveBeenCalledWith('answerEvaluated', {
            playersName: mockAnswer.playerName,
            room: expectedRoomCode,
            grade: expectedScore,
        });
        expect(component.answers).toEqual([]);
    });

    describe('getTime', () => {
        it('should call setNextQuestion when time is 0 and isNext is true', fakeAsync(() => {
            expectedData.time = 0;
            component['isNext'] = true;
            socketsServiceSpy.on.and.callFake((event, callback) => {
                if (event === 'timer') {
                    callback(expectedData as any);
                }
            });
            component['getTime']();

            expect(component.time).toBeNull();
            expect(component['isNext']).toBeFalse();
            expect(currentGameServiceSpy.setNextQuestion).toHaveBeenCalled();
        }));

        it('should call showQuestionResults and update disable when time is 0 and isShowResult is false', fakeAsync(() => {
            expectedData.time = 0;
            component['isNext'] = false;
            component['isShowResult'] = false;
            component['isAllFinish'] = false;
            Object.defineProperty(currentGameServiceSpy, 'isQCM', { value: true });
            socketsServiceSpy.on.and.callFake((event, callback) => {
                if (event === 'timer') {
                    callback(expectedData as any);
                }
            });
            spyOn(component as any, 'showQuestionResults');

            component['getTime']();

            expect(soundServiceSpy.stop).toHaveBeenCalled();
            expect(component.isAllFinish).toBeTrue();
            expect(component['showQuestionResults']).toHaveBeenCalled();
        }));

        it('should set time when "timer" event is emitted', () => {
            expectedData.time = 30;
            socketsServiceSpy.on.and.callFake((event, callback) => {
                if (event === 'timer') {
                    callback(expectedData as any);
                }
            });
            component['getTime']();
            expect(component.time).toBe(expectedData.time);
        });
    });

    it('should set properties correctly and call timerNextQuestion on currentGameService', () => {
        component['setNextQuestion']();
        expect(currentGameServiceSpy.setNextQuestion).toHaveBeenCalled();
        expect(component['isShowResult']).toBeFalse();
        expect(component['isNext']).toBeFalse();
        expect(component['isAllFinish']).toBeFalse();
        expect(component['isPaused']).toBeFalse();
        expect(component['isPanicMode']).toBeFalse();
    });

    describe('allPlayerFinish', () => {
        it('should show results when the QCM question is done', () => {
            Object.defineProperty(currentGameServiceSpy, 'isQCM', { value: true });
            socketsServiceSpy.on.and.callFake((event, callback) => {
                if (event === 'allFinish') {
                    callback(undefined as any);
                }
            });
            spyOn(component as any, 'showQuestionResults');

            component['allPlayerFinish']();

            expect(component['isAllFinish']).toBeTrue();
            expect(socketsServiceSpy.send).toHaveBeenCalledWith('stopTimer');
            expect(component['showQuestionResults']).toHaveBeenCalled();
        });

        it('should show results when the QRL question is done', () => {
            Object.defineProperty(currentGameServiceSpy, 'isQCM', { value: false });
            socketsServiceSpy.on.and.callFake((event, callback) => {
                if (event === 'allFinish') {
                    callback(undefined as any);
                }
            });
            component['allPlayerFinish']();
            expect(socketsServiceSpy.send).toHaveBeenCalledTimes(2);
            expect(socketsServiceSpy.send).toHaveBeenCalledWith('stopWaiting');
        });
    });

    it("should show the question's results and disable", () => {
        (component['currentGameService'] as any).isLast.and.returnValue(true);
        component['showQuestionResults']();
        expect(component.isShowResult).toBeTrue();
        expect(component.disable).toBeTrue();
        expect(currentGameServiceSpy.showResultQuestion).toHaveBeenCalled();
    });

    it('should alert the organizer and close the room if all players give up', fakeAsync(() => {
        // eslint-disable-next-line @typescript-eslint/ban-types
        socketsServiceSpy.on.and.callFake((command: string, callback: Function) => {
            if (command === 'allGaveUp') {
                callback();
            }
        });
        component['allPlayersGaveUp']();
        tick();
        expect(dialogsServiceSpy.openRedirectHome).toHaveBeenCalled();
        expect(socketsServiceSpy.send).toHaveBeenCalledWith('quitGame');
    }));

    it('should get open ended answers and sort them alphabetically', () => {
        const mockAnswer2 = { playerName: 'playerName2', answer: 'answer2' };
        const mockAnswer1 = { playerName: 'playerName1', answer: 'answer1' };

        component.answers = [mockAnswer2];
        // eslint-disable-next-line @typescript-eslint/ban-types
        socketsServiceSpy.on.and.callFake((command: string, callback: Function) => {
            if (command === 'newOpenEndedAnswer') {
                callback(mockAnswer1);
            }
        });
        currentGameServiceSpy.question = { type: 'QRL' } as Question;

        component['getAllOpenEndedAnswers']();

        expect(component.answers).toEqual([mockAnswer1, mockAnswer2]);
    });

    it('should call soundService.buttonClick on clickedButton', () => {
        component.buttonClick();
        expect(soundServiceSpy.buttonClick).toHaveBeenCalled();
    });
});
