import { Game } from '@app/interfaces/game/game';

export class GameDetails {
    _id?: number;
    id?: number;
    isVisible: boolean;
    isChecked: boolean;
    game: Game;

    constructor(gameDetails?: GameDetails) {
        if (gameDetails) {
            this.id = gameDetails.id;
            this.isVisible = gameDetails.isVisible;
            this.isChecked = gameDetails.isChecked;
            this.game = new Game(gameDetails.game);
        } else {
            this.id = 0;
            this.isVisible = false;
            this.isChecked = false;
            this.game = new Game();
        }
    }
}
