import { HistogramData } from '@app/interfaces/histogramData/histogram-data';

describe('HistogramData', () => {
    let service: HistogramData;

    it('should be created an filled by default', () => {
        service = new HistogramData();
        expect(service).toBeTruthy();
        expect(service.labelData).toEqual([]);
        expect(service.realData).toEqual([]);
        expect(service.colorData).toEqual([]);
    });
    it('should correctly initialize with given HistogramData', () => {
        const histogramData: HistogramData = {
            labelData: ['label1', 'label2'],
            realData: [1, 2],
            colorData: ['color1', 'color2'],
        };

        const instance: HistogramData = new HistogramData(histogramData);

        expect(instance.labelData).toEqual(histogramData.labelData);
        expect(instance.realData).toEqual(histogramData.realData);
        expect(instance.colorData).toEqual(histogramData.colorData);
    });

    it('should correctly initialize with empty arrays when no HistogramData is given', () => {
        const instance: HistogramData = {
            labelData: [],
            realData: [],
            colorData: [],
        };

        expect(instance.labelData).toEqual([]);
        expect(instance.realData).toEqual([]);
        expect(instance.colorData).toEqual([]);
    });
});
