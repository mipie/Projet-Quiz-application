import { SocketsService } from './sockets.service';
import { Socket } from 'socket.io-client';

describe('SocketsService', () => {
    let service: SocketsService;
    let mockSocket: jasmine.SpyObj<Socket>;

    beforeEach(() => {
        mockSocket = jasmine.createSpyObj('Socket', ['connect', 'disconnect', 'on', 'emit', 'connected']);
        service = new SocketsService();
        service['socket'] = mockSocket as unknown as Socket;
    });

    it('should be created', () => {
        service.connect();
        expect(service).toBeTruthy();
    });

    it('isSocketAlive should return true if socket is connected', () => {
        mockSocket.connected = true;
        expect(service.isSocketAlive()).toBeTrue();
    });

    it('isSocketAlive should return false if socket is not connected', () => {
        mockSocket.connected = false;
        expect(service.isSocketAlive()).toBeFalse();
    });

    it('on should register an event listener', () => {
        const callback = () => {
            return;
        };
        service.on('test-event', callback);
        expect(mockSocket.on).toHaveBeenCalledWith('test-event', callback);
    });

    it('send should emit an event', () => {
        const data = { sample: 'data' };
        const callback = () => {
            return;
        };
        service.send('test-event', data, callback);
        expect(mockSocket.emit).toHaveBeenCalledWith('test-event', data, callback);
    });

    it('send should emit an event without callback if not provided', () => {
        const data = { sample: 'data' };
        service.send('test-event', data);
        service.disconnect();
        expect(mockSocket.emit).toHaveBeenCalledWith('test-event', data);
    });
});
