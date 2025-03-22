import { Game } from '@app/interfaces/game/game';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';

describe('Interface: GameDetails', () => {
    let service: GameDetails;

    it('should be created an filled by default', () => {
        service = new GameDetails();
        expect(service).toBeTruthy();
        expect(service.id).toEqual(0);
        expect(service.isVisible).toBeFalse();
        expect(service.isChecked).toBeFalse();
    });

    it('should be created from another gameDetails', () => {
        const game = new GameDetails({
            id: 1,
            isVisible: true,
            isChecked: true,
            game: new Game(),
        });
        service = new GameDetails(game);
        expect(service).toEqual(game);
    });
});
