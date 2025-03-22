import { inject, Injectable } from '@angular/core';
import { SocketsService } from '../sockets/sockets.service';

@Injectable({
  providedIn: 'root'
})
export class ObserverService {
  isOrg: boolean = true;
  playerName: string = 'Organisateur';
  private socketService: SocketsService = inject(SocketsService);

  changeObserver(player: string) {
    this.isOrg = player === 'Organisateur' ? true : false;

    this.playerName = player;
    this.socketService.send('changeObs', player);
  }

  resetObs() {
    this.isOrg = true;
    this.playerName = 'Organisateur';
  }

}
