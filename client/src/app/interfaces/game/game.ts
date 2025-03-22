import { Question } from '@app/interfaces/question/question';

export class Game {
    _id?: number;
    $schema: string;
    title: string;
    description: string;
    duration: number | null;
    lastModification: Date;
    questions: Question[];

    constructor(game?: Game) {
        if (game) {
            this.$schema = game.$schema;
            this.title = game.title;
            this.description = game.description;
            this.duration = game.duration;
            this.lastModification = new Date(game.lastModification);
            this.questions = game.questions.map((question) => new Question(question));
        } else {
            this.$schema = '';
            this.title = '';
            this.description = '';
            this.duration = null;
            this.lastModification = new Date();
            this.questions = [];
        }
    }
}
