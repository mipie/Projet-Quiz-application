import { Player } from './player';

describe('Interface: Player', () => {
    let player: Player;

    beforeEach(() => {
        player = {
            name: 'Test Player',
            score: 100,
            isSurrender: false,
            bonus: 5,
            isFinish: false,
            isInteract: false,
            isMute: false,
            position: 0,
        };
    });

    it('should create a Player instance', () => {
        const playerInstance = new Player(player);
        expect(playerInstance).toBeTruthy();
    });

    it('should initialize properties when provided a Player object', () => {
        const playerInstance = new Player(player);
        expect(playerInstance.name).toEqual(player.name);
        expect(playerInstance.score).toEqual(player.score);
        expect(playerInstance.isSurrender).toEqual(player.isSurrender);
        expect(playerInstance.isFinish).toEqual(player.isFinish);
        expect(playerInstance.isInteract).toEqual(player.isInteract);
        expect(playerInstance.isMute).toEqual(player.isMute);
        expect(playerInstance.position).toEqual(player.position);
    });

    it('should initialize properties with default values when not provided a Player object', () => {
        const playerInstance = new Player();
        expect(playerInstance.name).toEqual('');
        expect(playerInstance.score).toEqual(0);
        expect(playerInstance.isSurrender).toEqual(false);
        expect(playerInstance.bonus).toEqual(0);
        expect(playerInstance.isFinish).toEqual(false);
        expect(playerInstance.isInteract).toEqual(false);
        expect(playerInstance.isMute).toEqual(false);
        expect(playerInstance.position).toEqual(0);
    });
});
