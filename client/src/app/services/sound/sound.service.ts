import { Injectable, inject } from '@angular/core';
import { SocketsService } from '@app/services/sockets/sockets.service';

@Injectable({
    providedIn: 'root',
})
export class SoundService {
    static activeButtonSound = true;
    private static audio = new Audio();
    private socketService: SocketsService = inject(SocketsService);

    playAudio(): void {
        this.socketService.on('playSound', () => {
            SoundService.audio.src = './assets/panicBouton.mp3';
            SoundService.audio.load();
            SoundService.audio.onloadeddata = () => {
                SoundService.audio.play();
            };
        });
    }

    stop(): void {
        SoundService.audio.pause();
    }

    toggleActivateButtonSound(): boolean {
        SoundService.activeButtonSound = !SoundService.activeButtonSound;
        return SoundService.activeButtonSound;
    }

    buttonClick(): void {
        if (SoundService.activeButtonSound) {
            SoundService.audio.src = './assets/clickedButton.mp3';
            SoundService.audio.load();
            SoundService.audio.play();
        }
    }
}
