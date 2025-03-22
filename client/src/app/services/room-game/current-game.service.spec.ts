import { TestBed } from '@angular/core/testing';

import { CurrentGameService } from './current-game.service';
import { BehaviorSubject } from 'rxjs';
import { Game } from '@app/interfaces/game/game';
import { RoomService } from './room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { MAX_GAME_DURATION } from '@app/constants';

describe('CurrentGameService', () => {
    let service: CurrentGameService;
    let roomService: jasmine.SpyObj<RoomService>;
    let socketsService: jasmine.SpyObj<SocketsService>;
    const gameMock: Game = {
        $schema: 'Game1.json',
        title: 'Game1',
        description: "Si le test marche, c'est magnifique.",
        duration: 30,
        lastModification: new Date('2023-09-11T20:20:39+00:00'),
        questions: [
            {
                type: 'QCM',
                text: 'Quelle est la première question?',
                points: 10,
                choices: [
                    {
                        text: 'Choice1',
                        isCorrect: true,
                        id: 111111,
                    },
                    {
                        text: 'Choice2',
                        isCorrect: false,
                        id: 222222,
                    },
                ],
                id: 1,
            },
            {
                type: 'QRL',
                text: 'Quelle est la deuxième question?',
                points: 10,
                choices: [],
                id: 1,
            },
        ],
    };

    beforeEach(() => {
        const roomServiceSpy = jasmine.createSpyObj('RoomService', ['name']);
        const socketsServiceSpy = jasmine.createSpyObj('SocketsService', ['send']);

        TestBed.configureTestingModule({
            providers: [
                { provide: RoomService, useValue: roomServiceSpy },
                { provide: SocketsService, useValue: socketsServiceSpy },
            ],
        });

        service = TestBed.inject(CurrentGameService);
        roomService = TestBed.inject(RoomService) as jasmine.SpyObj<RoomService>;
        socketsService = TestBed.inject(SocketsService) as jasmine.SpyObj<SocketsService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it("should get question's time", () => {
        const expectedTime = 50;
        service['timeValue'] = expectedTime;
        expect(service.time).toEqual(expectedTime);
    });

    it("should get if question's is the last", () => {
        service['isEnding'] = true;
        expect(service.isLast).toBeTrue();
    });

    it('should get if game exists', () => {
        service['game'] = undefined;
        expect(service.gameExist).toBeFalse();
    });

    it('should set the game', () => {
        const gameSubject = new BehaviorSubject<Game>(gameMock);
        service.setGame(gameSubject.getValue());

        expect(service['game']).toEqual(gameMock);
        expect(service['questionIndex']).toEqual(0);
        expect(service['questionsList']).toEqual(gameMock.questions);
        expect(service['timeValue']).toEqual(gameMock.duration);
        expect(service['roomCode']).toEqual(roomService.code);
        expect(service['isEnding']).toBeFalse();
    });

    it('should load the current question', () => {
        service['questionIndex'] = 0;
        service['questionsList'] = gameMock.questions;
        roomService['isHost'] = true;
        service['timeValue'] = 60;

        service.loadCurrentQuestion();

        expect(service['question']).toEqual(gameMock.questions[0]);
        expect(socketsService.send).toHaveBeenCalledWith('startTimer', { startValue: service['timeValue'], roomName: service['roomCode'] });

        service['questionIndex'] = 1;
        service['timeValue'] = MAX_GAME_DURATION;
        service.loadCurrentQuestion();

        expect(service['question']).toEqual(gameMock.questions[1]);
        expect(socketsService.send).toHaveBeenCalledWith('startTimer', { startValue: MAX_GAME_DURATION, roomName: service['roomCode'] });
    });

    it('should set the next question if the player is the organizer', async () => {
        service['questionIndex'] = 0;
        service['questionsList'] = [
            { type: 'QCM', text: 'Test question', points: 10 },
            { type: 'QCM', text: 'Test question 2', points: 20 },
        ];
        service['game'] = { duration: 10, $schema: '', title: 'Test Game', description: '', lastModification: new Date(), questions: [] };
        roomService['isHost'] = true;

        const loadCurrentQuestionSpy = spyOn(service, 'loadCurrentQuestion').and.stub();

        await service.setNextQuestion();

        expect(socketsService.send).toHaveBeenCalledWith('nextQuestion');
        expect(service['questionIndex']).toEqual(1);
        expect(service['timeValue']).toEqual(service['game'].duration);
        expect(loadCurrentQuestionSpy).toHaveBeenCalled();
    });

    it('should send histogram if the question type is QCM', () => {
        Object.defineProperty(service, 'isQCM', { value: true });
        service['questionsList'] = [{ type: 'QCM', text: 'Test question', points: 10 }];
        service['question'] = service['questionsList'][0];

        const sendHistogramSpy = spyOn(service['histogramService'], 'sendHistogram').and.stub();

        service.showResultQuestion();

        expect(sendHistogramSpy).toHaveBeenCalled();
    });

    it('should start 3 seconds timer before the next question if the player is the organizer', () => {
        service.timerNextQuestion();
        expect(socketsService.send).toHaveBeenCalledWith('startTimer', { startValue: 3, roomName: service['roomCode'] });
        expect(socketsService.send).toHaveBeenCalledWith('timerNextQuestion');
    });

    it("should show results if it's the last question", () => {
        service['questionsList'] = gameMock.questions;
        service['question'] = gameMock.questions[service['questionsList'].length - 1];

        service.showResultQuestion();

        expect(socketsService.send).toHaveBeenCalledWith('showResult');
        expect(socketsService.send).toHaveBeenCalledWith('addGradeCount', [0, 0, 0]);
        expect(service['isEnding']).toBeTrue();
    });

    it('should reset the game', () => {
        service.resetGame();
        expect(service['game']).toBeUndefined();
    });

    it('should return game title when game exists', () => {
        service['game'] = {
            title: 'Test Game',
            $schema: '',
            description: '',
            duration: 0,
            lastModification: new Date(),
            questions: [],
        };
        expect(service.title).toBe('Test Game');
    });

    it('should return empty string when game does not exist', () => {
        service['game'] = undefined;
        expect(service.title).toBe('');
    });

    it('should increment questionIndex and set question to the next question in questionsList', () => {
        service['questionsList'] = [
            { type: 'QCM', text: 'Question 1', points: 10 },
            { type: 'QCM', text: 'Question 2', points: 20 },
        ];
        service.questionIndex = 0;
        service.nextHistogram();
        expect(service.questionIndex).toBe(1);
        expect(service.question).toEqual(service['questionsList'][1]);
    });

    it('should decrement questionIndex and set question to the previous question in questionsList', () => {
        service['questionsList'] = [
            { type: 'QCM', text: 'Question 1', points: 10 },
            { type: 'QCM', text: 'Question 2', points: 20 },
        ];
        service.questionIndex = 1;
        service.previousHistogram();
        expect(service.questionIndex).toBe(0);
        expect(service.question).toEqual(service['questionsList'][0]);
    });

    it('should set questionIndex to 0 and question to the first question in questionsList', () => {
        service['questionsList'] = [
            { type: 'QCM', text: 'Question 1', points: 10 },
            { type: 'QCM', text: 'Question 2', points: 20 },
        ];
        service.firstHistogram();
        expect(service.questionIndex).toBe(0);
        expect(service.question).toEqual(service['questionsList'][0]);
    });
});
