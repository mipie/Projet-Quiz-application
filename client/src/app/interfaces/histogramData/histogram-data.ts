export class HistogramData {
    labelData: string[];
    realData: number[];
    colorData: string[];

    constructor(histogram?: HistogramData) {
        if (histogram) {
            this.labelData = histogram.labelData;
            this.realData = histogram.realData;
            this.colorData = histogram.colorData;
        } else {
            this.labelData = [];
            this.realData = [];
            this.colorData = [];
        }
    }
}
