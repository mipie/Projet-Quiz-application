import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { SocketsService } from '@app/services/sockets/sockets.service';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit {
    private socketService: SocketsService = inject(SocketsService);
    private router: Router = inject(Router);
    private currentGameService: CurrentGameService = inject(CurrentGameService);

    ngOnInit(): void {
        this.socketService.on('redirectResult', (response: boolean) => {
            if (response) {
                this.currentGameService.isGameDone = true;
                this.router.navigate(['result']);
            }
        });
    }
}
