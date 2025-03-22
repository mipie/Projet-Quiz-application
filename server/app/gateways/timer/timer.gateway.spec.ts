/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { TimerGateway } from './timer.gateway';
import { DELAY_PANIC_MODE } from './timer.gateway.constants';

describe('TimerGateway', () => {
    let gateway: TimerGateway;
    let mockServer: { to: jest.Mock; emit: jest.Mock };
    const mockSocket = {
        id: '12345-ABC',
    };

    beforeEach(async () => {
        mockServer = {
            to: jest.fn(),
            emit: jest.fn(),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TimerGateway,
                {
                    provide: Socket,
                    useValue: mockSocket,
                },
                {
                    provide: Server,
                    useValue: mockServer,
                },
            ],
        }).compile();
        gateway = module.get<TimerGateway>(TimerGateway);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should start timer', () => {
        const mockData = {
            startValue: 10,
            roomName: '1234',
        };
        mockServer.to = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        gateway['initializeTimerStates'] = jest.fn();
        gateway['getDataFromRoom'] = jest.fn().mockReturnValue({ time: 10, pauseState: false, panicState: false });
        gateway['server'] = mockServer as any;
        gateway['emitTime']();

        gateway.startTimer(mockSocket as any, mockData);

        expect(gateway['initializeTimerStates']).toHaveBeenCalledWith(mockData.startValue, '1234');
        expect(gateway['userToRoomMap'][mockSocket.id]).toBe('1234');
        expect(mockServer.to).toHaveBeenCalledWith('1234');
        expect(mockServer.to().emit).toHaveBeenCalledWith('timer', { time: 10, pauseState: false, panicState: false });
    });

    it('should stop timer', () => {
        const mockData = {
            startValue: 10,
            roomName: '1234',
        };
        gateway['userToRoomMap'][mockSocket.id] = mockData.roomName;
        gateway['timersMap'][mockData.roomName] = mockData.startValue;
        gateway['pauseState'][mockData.roomName] = true;
        gateway['panicState'][mockData.roomName] = false;

        gateway.stopTimer(mockSocket as Socket);

        expect(gateway['timersMap'][mockData.roomName]).toBeUndefined();
        expect(gateway['pauseState'][mockData.roomName]).toBeUndefined();
        expect(gateway['panicState'][mockData.roomName]).toBeUndefined();
    });

    it('should panic timer', () => {
        const mockData = {
            startValue: 10,
            roomName: '1234',
        };
        mockServer.to = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        gateway['userToRoomMap'][mockSocket.id] = mockData.roomName;
        gateway['timersMap'][mockData.roomName] = mockData.startValue;
        gateway['panicState'][mockData.roomName] = false;
        gateway['server'] = mockServer as any;
        gateway['emitTime']();

        gateway.panicTimer(mockSocket as Socket, mockData.startValue);

        expect(gateway['panicState'][mockData.roomName]).toBe(true);
        expect(mockServer.to).toHaveBeenCalledWith(mockData.roomName);
        expect(mockServer.to().emit).toHaveBeenCalledWith('playSound');
        expect(mockServer.to().emit).toHaveBeenCalledWith('timer', gateway['getDataFromRoom'](mockData.roomName));
    });

    it('should pause timer', () => {
        const mockData = {
            startValue: 10,
            roomName: '1234',
        };
        mockServer.to = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        gateway['userToRoomMap'][mockSocket.id] = mockData.roomName;
        gateway['timersMap'][mockData.roomName] = mockData.startValue;
        gateway['pauseState'][mockData.roomName] = true;
        gateway['server'] = mockServer as any;
        gateway['emitTime']();

        gateway.pauseTimer(mockSocket as Socket);

        expect(gateway['pauseState'][mockData.roomName]).toBe(false);
        expect(mockServer.to).toHaveBeenCalledWith(mockData.roomName);
        expect(mockServer.to().emit).toHaveBeenCalledWith('timer', gateway['getDataFromRoom'](mockData.roomName));
    });

    it('should after init', () => {
        jest.useFakeTimers();
        const DELAY_NORMAL_TIME = 1000;
        const DELAY_PANIC_TIME = 250;

        const setIntervalSpy1 = jest.spyOn(global, 'setInterval');
        const setIntervalSpy2 = jest.spyOn(global, 'setInterval');

        gateway.afterInit();
        jest.advanceTimersByTime(DELAY_NORMAL_TIME);
        jest.advanceTimersByTime(DELAY_PANIC_TIME);

        expect(setIntervalSpy1).toHaveBeenCalledWith(expect.any(Function), DELAY_NORMAL_TIME);
        expect(setIntervalSpy2).toHaveBeenCalledWith(expect.any(Function), DELAY_PANIC_MODE);
    });

    it('should emit time', () => {
        const mockData = {
            startValue: 10,
            roomName: '1234',
        };
        mockServer.to = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        gateway['server'] = mockServer as any;
        gateway['timersMap'][mockData.roomName] = mockData.startValue;
        gateway['pauseState'][mockData.roomName] = false;
        gateway['panicState'][mockData.roomName] = false;

        gateway['emitTime']();

        expect(gateway['timersMap'][mockData.roomName]).toBe(mockData.startValue - 1);
        expect(mockServer.to).toHaveBeenCalledWith(mockData.roomName);
        expect(mockServer.to().emit).toHaveBeenCalledWith('timer', gateway['getDataFromRoom'](mockData.roomName));
    });

    it('should emit time panic', () => {
        const mockData = {
            startValue: 10,
            roomName: '1234',
        };
        mockServer.to = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        gateway['server'] = mockServer as any;
        gateway['timersMap'][mockData.roomName] = mockData.startValue;
        gateway['pauseState'][mockData.roomName] = false;
        gateway['panicState'][mockData.roomName] = true;

        gateway['emitTimePanic']();

        expect(gateway['timersMap'][mockData.roomName]).toBe(mockData.startValue - 1);
        expect(mockServer.to).toHaveBeenCalledWith(mockData.roomName);
        expect(mockServer.to().emit).toHaveBeenCalledWith('timer', gateway['getDataFromRoom'](mockData.roomName));
    });

    it('should get data from room', () => {
        const mockData = {
            startValue: 10,
            roomName: '1234',
        };
        gateway['timersMap'][mockData.roomName] = mockData.startValue;
        gateway['pauseState'][mockData.roomName] = true;
        gateway['panicState'][mockData.roomName] = false;

        const data = gateway['getDataFromRoom'](mockData.roomName);
        expect(data.time).toBe(mockData.startValue);
        expect(data.pauseState).toBe(true);
        expect(data.panicState).toBe(false);
    });

    it('should initialize timer states', () => {
        const mockData = {
            startValue: 10,
            roomName: '1234',
        };
        gateway['timersMap'][mockData.roomName] = mockData.startValue;
        gateway['pauseState'][mockData.roomName] = false;
        gateway['panicState'][mockData.roomName] = false;

        gateway['initializeTimerStates'](mockData.startValue, mockData.roomName);
        expect(gateway['timersMap'][mockData.roomName]).toBe(mockData.startValue);
        expect(gateway['pauseState'][mockData.roomName]).toBe(false);
        expect(gateway['panicState'][mockData.roomName]).toBe(false);
    });

    it('should delete timer states', () => {
        const mockData = {
            startValue: 10,
            roomName: '1234',
        };
        gateway['timersMap'][mockData.roomName] = mockData.startValue;
        gateway['pauseState'][mockData.roomName] = false;
        gateway['panicState'][mockData.roomName] = false;

        gateway['deleteTimerStates'](mockData.roomName);
        expect(gateway['timersMap'][mockData.roomName]).toBeUndefined();
        expect(gateway['pauseState'][mockData.roomName]).toBeUndefined();
        expect(gateway['panicState'][mockData.roomName]).toBeUndefined();
    });
});
