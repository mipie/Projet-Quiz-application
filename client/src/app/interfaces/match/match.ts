export class Match {
    title: string;
    startDate: Date;
    numberPlayers: number;
    bestScore: number;

    constructor(match?: Match) {
        if (match) {
            this.title = match.title;
            this.startDate = new Date(match.startDate);
            this.numberPlayers = match.numberPlayers;
            this.bestScore = match.bestScore;
        } else {
            this.title = '';
            this.startDate = new Date();
            this.numberPlayers = 0;
            this.bestScore = 0;
        }
    }
}
