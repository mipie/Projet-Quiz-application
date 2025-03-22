import { IdGeneratorService } from '@app/services/id/id-generator.service';
import { Choice } from '@app/interfaces/choice/choice';
import { Qre } from '@app/interfaces/question/qre';

export class Question {
    _id?: number;
    id?: number;
    type: string;
    text: string;
    points: number;
    choices?: Choice[];
    qre?: Qre;
    imageUrl?: string[];
    imageFiles?: File | undefined;

    constructor(question?: Question) {
        IdGeneratorService.initialize();
        this.id = IdGeneratorService.getNextQuestionId();
        if (question) {
            this.type = question.type;
            this.text = question.text;
            this.points = question.points;
            this.choices = question?.choices ? question.choices.map((choice) => new Choice(choice)) : [];
            this.qre = question.qre ? new Qre(question.qre) : new Qre();
            this.imageUrl = question.imageUrl ? [...question.imageUrl] : [];
            this.imageFiles = question.imageFiles;
        } else {
            this.type = '';
            this.text = '';
            this.points = 0;
            this.choices = [];
            this.qre = new Qre();
            this.imageFiles = undefined;
            this.imageUrl = [];
        }
    }
}
