import { IdGeneratorService } from '@app/services/id/id-generator.service';

export class Qre {
    _id?: number;
    id?: number;
    lowerBound: number | undefined;
    goodAnswer: number | undefined;
    margin: number | undefined;
    upperBound: number | undefined;

    constructor(qre?: Qre) {
        IdGeneratorService.initialize();
        this.id = IdGeneratorService.getNextChoiceId();
        if (qre) {
            this.lowerBound = qre.lowerBound;
            this.goodAnswer = qre.goodAnswer;
            this.margin = qre.margin;
            this.upperBound = qre.upperBound;
        } else {
            this.lowerBound = undefined;
            this.goodAnswer = undefined;
            this.margin = undefined;
            this.upperBound = undefined;
        }
    }
}
