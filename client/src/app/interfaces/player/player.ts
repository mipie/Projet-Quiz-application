export class Player {
    name: string;
    isSurrender: boolean;
    score: number;
    bonus: number;
    isFinish: boolean;
    isInteract: boolean;
    isMute: boolean;
    position: number;
    nbGoodAnswersPlayer: number;

    constructor(player?: Player) {
        if (player) {
            this.name = player.name;
            this.isSurrender = player.isSurrender;
            this.score = player.score;
            this.bonus = player.bonus;
            this.isFinish = player.isFinish;
            this.isInteract = player.isInteract;
            this.isMute = player.isMute;
            this.position = player.position;
            this.nbGoodAnswersPlayer = player.nbGoodAnswersPlayer;
        } else {
            this.name = '';
            this.isSurrender = false;
            this.score = 0;
            this.bonus = 0;
            this.isFinish = false;
            this.isInteract = false;
            this.isMute = false;
            this.position = 0;
            this.nbGoodAnswersPlayer = 0;
        }
    }
}
