import { Match } from '@app/interfaces/match/match';

describe('Interface: Match', () => {
    let service: Match;

    it('should be created and filled by default', () => {
        service = new Match();
        expect(service).toBeTruthy();
        expect(service.title).toEqual('');
        expect(service.numberPlayers).toEqual(0);
        expect(service.bestScore).toEqual(0);
    });

    it('should be created from another Match', () => {
        const match = new Match({
            title: 'TestMatch',
            startDate: new Date('2023-12-03'),
            numberPlayers: 5,
            bestScore: 150,
        });

        service = new Match(match);
        expect(service).toEqual(match);
    });
});
