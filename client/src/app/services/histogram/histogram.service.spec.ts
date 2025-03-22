import { TestBed } from '@angular/core/testing';

import { HistogramService } from './histogram.service';
import { HistogramData } from '@app/interfaces/histogramData/histogram-data';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { SCORE_DIVISOR_TO_INDEX } from '@app/constants';

describe('HistogramService', () => {
    let service: HistogramService;
    let mockHistogramData: HistogramData;
    let mockLabelData: string[];
    let mockRealData: number[];
    let mockColorData: string[];
    let socketUsersSpy: jasmine.SpyObj<SocketsService>;

    beforeEach(() => {
        socketUsersSpy = jasmine.createSpyObj('SocketsService', ['send']);
        TestBed.configureTestingModule({
            providers: [HistogramService, { provide: SocketsService, useValue: socketUsersSpy }],
        });
        service = TestBed.inject(HistogramService);
        mockHistogramData = {
            labelData: ['label1', 'label2'], // replace with appropriate mock data
            realData: [1, 2], // replace with appropriate mock data
            colorData: ['#000000', '#FFFFFF'], // replace with appropriate mock data
        };
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should update histogram data', () => {
        service.updateHistogram(mockHistogramData);
        service.chartData.subscribe((data) => {
            expect(data).toEqual(mockHistogramData);
        });
    });

    it('should update data', () => {
        service.updateData(mockLabelData, mockRealData, mockColorData);
        expect(service.labelData).toEqual(mockLabelData);
        expect(service.realData).toEqual(mockRealData);
        expect(service.colorData).toEqual(mockColorData);
    });

    it('should send histogram data', () => {
        service.sendHistogram();
        expect(socketUsersSpy.send).toHaveBeenCalledWith('addHistogram', {
            labelData: service.labelData,
            realData: service.realData,
            colorData: service.colorData,
        });
    });
    it('should sum grade', () => {
        const score = 50; // replace with an appropriate score
        const initialCount = service.gradeCount[score / SCORE_DIVISOR_TO_INDEX];
        service.sumGrade(score);
        expect(service.gradeCount[score / SCORE_DIVISOR_TO_INDEX]).toEqual(initialCount + 1);
    });
});
