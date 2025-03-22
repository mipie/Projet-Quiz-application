import { IdGeneratorService } from '@app/services/id/id-generator.service';

export class Choice {
    _id?: number;
    id?: number;
    text: string;
    isCorrect: boolean;
    constructor(choice?: Choice) {
        IdGeneratorService.initialize();
        this.id = IdGeneratorService.getNextChoiceId();
        if (choice) {
            this.text = choice.text;
            this.isCorrect = choice.isCorrect;
        } else {
            this.text = '';
            this.isCorrect = false;
        }
    }
}
