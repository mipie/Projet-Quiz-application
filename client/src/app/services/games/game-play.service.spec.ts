/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { Choice } from '@app/interfaces/choice/choice';
import { RoomService } from '@app/services/room-game/room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { GamePlayService } from './game-play.service';

describe('GamePlayService', () => {
    let service: GamePlayService;
    let roomService: jasmine.SpyObj<RoomService>;
    let socketSpy: jasmine.SpyObj<SocketsService>;

    beforeEach(() => {
        const roomSpy = jasmine.createSpyObj('RoomService', ['getRoom']);
        socketSpy = jasmine.createSpyObj('SocketsService', ['emit', 'send']);

        TestBed.configureTestingModule({
            providers: [GamePlayService, { provide: RoomService, useValue: roomSpy }, { provide: SocketsService, useValue: socketSpy }],
        });

        service = TestBed.inject(GamePlayService);
        roomService = TestBed.inject(RoomService) as jasmine.SpyObj<RoomService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('onKeydownNumber', () => {
        it('should not select a choice if the target element has id "message-input"', () => {
            const event = new KeyboardEvent('keydown', {
                key: '1',
            });
            spyOnProperty(event, 'target').and.returnValue({
                id: 'message-input',
            } as unknown as EventTarget);
            const selectedChoice = [false, false, false];
            const choicesIndex = 3;
            service['roomService'] = new RoomService();
            socketSpy.send.and.returnValue();

            service.onKeydownNumber(event, selectedChoice, choicesIndex);
            expect(selectedChoice).toEqual([false, false, false]);
        });

        it('should toggle the selected choice and send a message if the active game exists', () => {
            const event = new KeyboardEvent('keydown', {
                key: '1',
            });
            spyOnProperty(event, 'target').and.returnValue({
                id: 'message-input',
            } as unknown as EventTarget);
            const selectedChoice = [false, false, false];
            const choicesIndex = 3;
            roomService.activeGame = true;
            service.onKeydownNumber(event, selectedChoice, choicesIndex);
            expect(selectedChoice).toEqual([false, false, false]);
        });

        it('should not toggle a choice if the event key is 0', () => {
            roomService.activeGame = true;
            const zeroKeyEvent = new KeyboardEvent('keydown', {
                key: '1',
            });
            spyOnProperty(zeroKeyEvent, 'target').and.returnValue({
                id: 'some-element',
            } as unknown as EventTarget);
            const selectedChoice = [false, false, false];
            const choicesIndex = 3;
            service.onKeydownNumber(zeroKeyEvent, selectedChoice, choicesIndex);
            expect(selectedChoice).toEqual([true, false, false]);
        });
    });

    describe('isConfirmAnswerSelected', () => {
        let selectedChoice: boolean[];
        let choicesIndex: number;
        let time: number | null;

        beforeEach(() => {
            selectedChoice = [false, false, false, false];
            choicesIndex = 0;
            time = null;
        });

        it('should return false if no choice is selected', () => {
            const result = service.isConfirmAnswerSelected(selectedChoice, choicesIndex, time);
            expect(result).toBeFalse();
        });

        it('should return true if a choice is selected and time is null', () => {
            selectedChoice[0] = true;
            const result = service.isConfirmAnswerSelected(selectedChoice, choicesIndex, time);
            expect(result).toBeTrue();
        });

        it('should return true if a choice is selected and time is greater than 0', () => {
            selectedChoice[0] = true;
            time = 1;
            const result = service.isConfirmAnswerSelected(selectedChoice, choicesIndex, time);
            expect(result).toBeTrue();
        });

        it('should return false if no choice is selected and time is greater than 0', () => {
            time = 1;
            const result = service.isConfirmAnswerSelected(selectedChoice, choicesIndex, time);
            expect(result).toBeFalse();
        });
    });

    describe('rightAnswer', () => {
        it('should return true if the selected choice is the right answer', () => {
            const selectedChoice = [false, true, false, false];
            const choicesIndex = 1;
            const questionChoices: Choice[] = [
                { id: 1, text: 'Choice 1', isCorrect: false },
                { id: 2, text: 'Choice 2', isCorrect: true },
                { id: 3, text: 'Choice 3', isCorrect: false },
                { id: 4, text: 'Choice 4', isCorrect: false },
            ];
            const result = service.rightAnswer(selectedChoice, choicesIndex, questionChoices);
            expect(result).toBeTrue();
        });

        it('should return false if the selected choice is not the right answer', () => {
            const selectedChoice = [false, false, true, false];
            const choicesIndex = 2;
            const questionChoices: Choice[] = [
                { id: 1, text: 'Choice 1', isCorrect: false },
                { id: 2, text: 'Choice 2', isCorrect: true },
                { id: 3, text: 'Choice 3', isCorrect: false },
                { id: 4, text: 'Choice 4', isCorrect: false },
            ];
            const result = service.rightAnswer(selectedChoice, choicesIndex, questionChoices);
            expect(result).toBeFalse();
        });

        it('should return false if the selected choice is not the right answer and there is no right answer', () => {
            const selectedChoice = [false, false, true, false];
            const choicesIndex = 2;
            const questionChoices: Choice[] = [
                { id: 2, text: 'Choice 2', isCorrect: false },
                { id: 1, text: 'Choice 1', isCorrect: false },
                { id: 3, text: 'Choice 3', isCorrect: false },
                { id: 4, text: 'Choice 4', isCorrect: false },
            ];
            const result = service.rightAnswer(selectedChoice, choicesIndex, questionChoices);
            expect(result).toBeTrue();
        });
    });
});
