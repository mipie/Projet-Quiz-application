import { Injectable, inject } from '@angular/core';
import { SCORE_DIVISOR_TO_INDEX } from '@app/constants';
import { HistogramData } from '@app/interfaces/histogramData/histogram-data';
import { BehaviorSubject } from 'rxjs';
import { SocketsService } from './../sockets/sockets.service';

@Injectable({
    providedIn: 'root',
})
export class HistogramService {
    chartData = new BehaviorSubject<HistogramData>({ labelData: [], realData: [], colorData: [] });
    labelData: string[] = [];
    realData: number[] = [];
    colorData: string[] = [];
    gradeCount: number[] = [0, 0, 0];
    private socketUsers: SocketsService = inject(SocketsService);

    updateHistogram(histogram: HistogramData) {
        this.chartData.next(histogram);
    }

    updateData(labelData: string[], realData: number[], colorData: string[]) {
        this.labelData = labelData;
        this.realData = realData;
        this.colorData = colorData;
    }

    sendHistogram() {
        this.socketUsers.send('addHistogram', { labelData: this.labelData, realData: this.realData, colorData: this.colorData });
    }

    sendGradeCount() {
        this.socketUsers.send('addGradeCount', this.gradeCount);
        this.gradeCount = [0, 0, 0];
    }

    sumGrade(score: number) {
        this.gradeCount[score / SCORE_DIVISOR_TO_INDEX]++;
    }
}
