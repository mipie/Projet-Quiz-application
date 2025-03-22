/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Component, Input, OnInit, inject } from '@angular/core';
import { Choice } from '@app/interfaces/choice/choice';
import { HistogramData } from '@app/interfaces/histogramData/histogram-data';
import { Question } from '@app/interfaces/question/question';
import { User } from '@app/interfaces/user/user';
import { GamePlayService } from '@app/services/games/game-play.service';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { LangueService } from '@app/services/langues/langue.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { Chart, registerables } from 'chart.js';
import { ACCEPTEDVALUES, BADANSWER, CHAMP, GOODANSWER, NOMARGE, NONCHAMP } from './constants';
Chart.register(...registerables);

@Component({
    selector: 'app-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss'],
})
export class HistogramComponent implements OnInit {
    @Input() isObserver: boolean = false;
    currentUser: User | null;
    chartQRLChamp: string = '';
    chartQRLNonChamp: string = '';
    acceptedValueQRE: string = '';
    nonAcceptedMargeQRE: string = '';
    badAnswerQRE: string = '';
    goodAnswerQRE: string = '';
    chart: Chart;
    private labelData: string[] = [];
    private realData: number[] = [];
    private colorData: string[] = [];
    private currentGameService: CurrentGameService = inject(CurrentGameService);
    private socketService: SocketsService = inject(SocketsService);
    private histogramService: HistogramService = inject(HistogramService);
    private gamePlayService: GamePlayService = inject(GamePlayService);
    private languageService: LangueService = inject(LangueService);

    get choices(): Choice[] {
        return this.currentGameService.question.choices!;
    }

    get isQCM(): boolean {
        return this.currentGameService.isQCM;
    }

    get isQRL(): boolean {
        return this.currentGameService.isQRL;
    }

    get isQRE(): boolean {
        return this.currentGameService.isQRE;
    }

    ngOnInit(): void {
        this.updatedLabelLanguage(this.languageService.language);
        this.histogramService.chartData.asObservable().subscribe((histogram) => {
            this.labelData = histogram.labelData;
            this.realData = histogram.realData;
            this.colorData = histogram.colorData;
            if (this.labelData && this.labelData.length > 0) this.renderChart(this.labelData, this.realData, this.colorData);
        });

        this.currentGameService.choicesSubject.asObservable().subscribe((question: Question) => {
            if (question.type === 'QCM') {
                this.realData = [];
                this.labelData = question.choices!.map((choice, index) => String(index + 1));
                this.colorAnswer(question.choices!);
            } else if (question.type === 'QRL') {
                this.realData = [];
                this.labelData = [this.chartQRLChamp, this.chartQRLNonChamp];
                this.colorData = ['rgba(12, 230, 164, 0.821)', 'rgba(252, 76, 111, 0.771)'];
            } else {
                const lowerMargin = this.gamePlayService.calculateMargin(question, false);
                const upperMargin = this.gamePlayService.calculateMargin(question, true);
                const acceptedValues =
                    (lowerMargin !== 0 && upperMargin !== lowerMargin) || (upperMargin !== 0 && upperMargin !== lowerMargin)
                        ? `${this.acceptedValueQRE}: [${lowerMargin}, ${upperMargin}]`
                        : this.nonAcceptedMargeQRE;
                const badAnswer =
                    (lowerMargin !== 0 && upperMargin !== lowerMargin) || (upperMargin !== 0 && upperMargin !== lowerMargin)
                        ? `${this.badAnswerQRE}: ] ${lowerMargin}, ${upperMargin} [`
                        : this.badAnswerQRE;
                this.realData = [];
                this.labelData = [acceptedValues, `${this.goodAnswerQRE}: ${question.qre?.goodAnswer}`, badAnswer];
                this.colorData = ['rgba(255, 255, 255, 0.5)', 'rgba(12, 230, 164, 0.821)', 'rgba(252, 76, 111, 0.771)'];
            }
            if (this.labelData && this.labelData.length > 0) {
                this.renderChart(this.labelData, this.realData, this.colorData);
            }
        });
        this.histogramGrade();
        this.sumChoices();
        this.sumInteractions();
        this.sumEstimateResponse();
    }

    updatedLabelLanguage(language: string): void {
        this.chartQRLChamp = CHAMP[language];
        this.chartQRLNonChamp = NONCHAMP[language];
        this.acceptedValueQRE = ACCEPTEDVALUES[language];
        this.nonAcceptedMargeQRE = NOMARGE[language];
        this.badAnswerQRE = BADANSWER[language];
        this.goodAnswerQRE = GOODANSWER[language];
    }

    renderChart(labelData: string[], mainData: number[], colorData: string[]) {
        const existingChart = Chart.getChart('myChart');
        if (existingChart) existingChart.destroy();
        this.histogramService.updateData(labelData, mainData, colorData);

        Chart.defaults.font.family = 'textFont';
        Chart.defaults.font.size = 16;
        Chart.defaults.color = 'black';
        Chart.defaults.scale.type = 'linear';
        Chart.defaults.plugins.legend.labels.boxWidth = 0;

        const colorLabels = [];
        for (const color of colorData) {
            if (color === 'rgba(12, 230, 164, 0.821)') colorLabels.push('rgb(9, 121, 87)');
            else if (color === 'rgba(252, 76, 111, 0.771)') colorLabels.push('rgba(147, 45, 66)');
            else colorLabels.push('rgba(255, 255, 0, 0.785)');
        }

        new Chart('myChart', {
            type: 'bar',
            data: {
                labels: labelData,
                datasets: [
                    {
                        label: '',
                        data: mainData,
                        backgroundColor: colorData,
                        borderColor: colorData,
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                scales: {
                    x: {
                        ticks: {
                            font: {
                                family: 'textFont',
                            },
                            color: colorLabels,
                        },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                        },
                    },
                },
            },
        });
    }

    private colorAnswer(choiceList: Choice[]) {
        this.colorData = [];
        const rightList = choiceList?.map((choice) => choice.isCorrect);
        for (const choice of rightList) {
            if (choice) this.colorData.push('rgba(12, 230, 164, 0.821)');
            else this.colorData.push('rgba(252, 76, 111, 0.771)');
        }
    }

    private sumEstimateResponse() {
        this.socketService.on('resultEstimateResponse', (result: number[]) => {
            if ((this.isQRE && this.isObserver) || !this.isObserver) {
                this.realData = result;
                this.renderChart(this.labelData, this.realData, this.colorData);
            }
        });
    }

    private sumChoices() {
        this.socketService.on('resultChoice', (result: number[]) => {
            if ((this.isQCM && this.isObserver) || !this.isObserver) {
                this.realData = result;
                this.renderChart(this.labelData, this.realData, this.colorData);
            }
        });
    }

    private sumInteractions() {
        this.socketService.on('resultInteractions', (result: number[]) => {
            if ((this.isQRL && this.currentGameService.disable && this.isObserver) || !this.isObserver) {
                this.realData = result;
                this.renderChart(this.labelData, this.realData, this.colorData);
            }
        });
    }

    private histogramGrade() {
        this.socketService.on('resultatGrade', (result: HistogramData) => {
            if ((this.isQRL && !this.currentGameService.disable && this.isObserver) || !this.isObserver) {
                this.renderChart(result.labelData, result.realData, result.colorData);
            }
        });
    }
}
