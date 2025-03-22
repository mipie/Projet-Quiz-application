import { Component, inject } from '@angular/core';
import { SoundService } from '@app/services/sound/sound.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
    activateButtonSound: boolean = SoundService.activeButtonSound;
    private soundService: SoundService = inject(SoundService);

    toggleButtonClickSound(event: Event) {
        event.stopPropagation();
        this.activateButtonSound = this.soundService.toggleActivateButtonSound();
    }
}
