import { TestBed } from '@angular/core/testing';
import { SoundService } from './sound.service';
import { SocketsService } from '@app/services/sockets/sockets.service';

describe('SoundService', () => {
    let service: SoundService;
    let mockSocketService: jasmine.SpyObj<SocketsService>;

    beforeEach(() => {
        mockSocketService = jasmine.createSpyObj('SocketService', ['on']);
        TestBed.configureTestingModule({
            providers: [SoundService, { provide: SocketsService, useValue: mockSocketService }],
        });
        service = TestBed.inject(SoundService);
        SoundService['audio'] = jasmine.createSpyObj('audio', ['load', 'play', 'pause']);
    });

    it('should play audio when playSound event is received', () => {
        // Arrange
        const audioSrc = './assets/panicBouton.mp3';
        const mockData = {}; // Replace this with the actual data structure if needed
        const audioSpy = jasmine.createSpyObj('audio', ['load', 'play']);
        SoundService['audio'] = audioSpy;

        service.playAudio();
        mockSocketService.on.calls.mostRecent().args[1](mockData);
        audioSpy.onloadeddata();

        expect(audioSpy.src).toBe(audioSrc);
        expect(audioSpy.load).toHaveBeenCalled();
        expect(audioSpy.play).toHaveBeenCalled();
    });

    it('should pause audio when stop is called', () => {
        service.stop();
        expect(SoundService['audio'].pause).toHaveBeenCalled();
    });

    it('should toggle button click sound', () => {
        SoundService.activeButtonSound = false;
        const actualValue = service.toggleActivateButtonSound();
        expect(actualValue).toBeTrue();
    });

    it('should play button click sound', () => {
        SoundService.activeButtonSound = true;
        const audioSrc = './assets/clickedButton.mp3';
        service.buttonClick();
        expect(SoundService['audio'].src).toBe(audioSrc);
        expect(SoundService['audio'].load).toHaveBeenCalled();
        expect(SoundService['audio'].play).toHaveBeenCalled();
    });
});
