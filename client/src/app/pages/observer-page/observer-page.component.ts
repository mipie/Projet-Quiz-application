import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { ObserverService } from '@app/services/observer/observer-service.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { SocketsService } from '@app/services/sockets/sockets.service';

@Component({
    selector: 'app-observer-page',
    templateUrl: './observer-page.component.html',
    styleUrls: ['./observer-page.component.scss'],
})
export class ObserverPageComponent implements OnInit {
    isOrganizer: boolean = true;
    private router: Router = inject(Router);
    private socketService: SocketsService = inject(SocketsService);
    private currentGameService: CurrentGameService = inject(CurrentGameService);
    private observerService: ObserverService = inject(ObserverService);
    private dialogService: DialogsService = inject(DialogsService);

    get isOrg(): boolean {
        return this.observerService.isOrg;
    }

    ngOnInit(): void {
        this.observerService.resetObs();
        this.observersToResult();
        this.goToHome();
    }

    observersToResult(): void {
        this.socketService.on('redirectResult', (response: boolean) => {
            if (response) {
                this.currentGameService.isGameDone = true;
                this.router.navigate(['result']);
            }
        });
    }

    goToHome(): void {
        this.socketService.on('viewToHome', async (hasOrgQuit: boolean) => {
            await this.dialogService.openRedirectHome("L'organisateur a quitté la partie.", 'OK!');
        });
    }
}
