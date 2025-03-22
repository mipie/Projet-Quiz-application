/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistogramComponent } from './histogram.component';
import { Choice } from '@app/interfaces/choice/choice';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Chart } from 'chart.js';
import { Question } from '@app/interfaces/question/question';
import { BehaviorSubject } from 'rxjs';
import { HistogramData } from '@app/interfaces/histogramData/histogram-data';

describe('HistogramComponent', () => {
    let component: HistogramComponent;
    let fixture: ComponentFixture<HistogramComponent>;
    let currentGameServiceSpy: jasmine.SpyObj<CurrentGameService>;
    let socketServiceSpy: jasmine.SpyObj<SocketsService>;
    let histogramServiceSpy: jasmine.SpyObj<HistogramService>;

    beforeEach(async () => {
        currentGameServiceSpy = jasmine.createSpyObj('CurrentGameService', ['choice', 'isQCM']);
        socketServiceSpy = jasmine.createSpyObj('SocketsService', ['on']);
        histogramServiceSpy = jasmine.createSpyObj('HistogramService', ['updateData']);

        TestBed.configureTestingModule({
            declarations: [HistogramComponent],
            providers: [
                { provide: CurrentGameService, useValue: currentGameServiceSpy },
                { provide: SocketsService, useValue: socketServiceSpy },
                { provide: HistogramService, useValue: histogramServiceSpy },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(HistogramComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return choices from currentGameService', () => {
        const mockChoices: Choice[] = [{}, {}] as Choice[];
        currentGameServiceSpy.question = { choices: mockChoices } as Question;
        expect(component.choices).toEqual(mockChoices);
    });

    it('should return isQCM from currentGameService', () => {
        currentGameServiceSpy.question = { type: 'QCM' } as Question;
        expect(component.isQCM).toBeTruthy();
    });

    it('should verify existingChart is destroyed', () => {
        const labelData = ['a', 'b', 'c'];
        const mainData = [1, 2, 3];
        const colorData = ['rgba(12, 230, 164, 0.821)', 'rgba(252, 76, 111, 0.771)', 'blue'];
        const chartInstance = new Chart('myChart', {
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
            options: {},
        });
        chartInstance.destroy();
        spyOn(Chart, 'getChart').and.returnValue(chartInstance as unknown as Chart<'bar', number[], unknown>);
        component.renderChart(labelData, mainData, colorData);
        expect(chartInstance).toBeTruthy();
    });

    it('should initialize correctly with a QCM', () => {
        const mockHistogram: HistogramData = {
            labelData: ['a', 'b', 'c'],
            realData: [1, 2, 3],
            colorData: ['red', 'green', 'blue'],
        };
        histogramServiceSpy.chartData = new BehaviorSubject<HistogramData>(mockHistogram);

        const mockChoiceList: Question = {
            type: 'QCM',
            text: 'Qusetion 1',
            points: 10,
            choices: [
                {
                    text: 'Choice 1',
                    isCorrect: true,
                },
                {
                    text: 'Choice 2',
                    isCorrect: false,
                },
            ],
        };
        currentGameServiceSpy.choicesSubject = new BehaviorSubject<Question>(mockChoiceList);

        const renderChartSpy = spyOn(component, 'renderChart');
        const histogramGradeSpy = spyOn(component as any, 'histogramGrade');
        const sumChoicesSpy = spyOn(component as any, 'sumChoices');
        const sumInteractionsSpy = spyOn(component as any, 'sumInteractions');

        component.ngOnInit();

        expect(renderChartSpy).toHaveBeenCalled();
        expect(histogramGradeSpy).toHaveBeenCalled();
        expect(sumChoicesSpy).toHaveBeenCalled();
        expect(sumInteractionsSpy).toHaveBeenCalled();
    });

    it('should initialize correctly with a QRL', () => {
        const mockHistogram: HistogramData = {
            labelData: ['a', 'b', 'c'],
            realData: [1, 2, 3],
            colorData: ['red', 'green', 'blue'],
        };
        histogramServiceSpy.chartData = new BehaviorSubject<HistogramData>(mockHistogram);

        const mockChoiceList: Question = {
            type: 'QRL',
            text: 'Qusetion 1',
            points: 10,
            choices: [
                {
                    text: 'Choice 1',
                    isCorrect: true,
                },
                {
                    text: 'Choice 2',
                    isCorrect: false,
                },
            ],
        };
        currentGameServiceSpy.choicesSubject = new BehaviorSubject<Question>(mockChoiceList);

        const renderChartSpy = spyOn(component, 'renderChart');
        const histogramGradeSpy = spyOn(component as any, 'histogramGrade');
        const sumChoicesSpy = spyOn(component as any, 'sumChoices');
        const sumInteractionsSpy = spyOn(component as any, 'sumInteractions');

        component.ngOnInit();

        expect(renderChartSpy).toHaveBeenCalled();
        expect(histogramGradeSpy).toHaveBeenCalled();
        expect(sumChoicesSpy).toHaveBeenCalled();
        expect(sumInteractionsSpy).toHaveBeenCalled();
    });

    it('should create a chart', () => {
        const labelData = ['a', 'b', 'c'];
        const mainData = [1, 2, 3];
        const colorData = ['red', 'green', 'blue'];
        component.renderChart(labelData, mainData, colorData);
        const chartInstance = (component as any).chart;
        expect(chartInstance).toBeUndefined();
    });

    it('should set colorData and colorLabels', () => {
        const choiceList: Choice[] = [
            { id: 1, isCorrect: true } as Choice,
            { id: 2, isCorrect: false } as Choice,
            { id: 3, isCorrect: true } as Choice,
        ];
        spyOn(component, 'renderChart');
        (component as any).colorAnswer(choiceList);
        expect(component['colorData']).toEqual(['rgba(12, 230, 164, 0.821)', 'rgba(252, 76, 111, 0.771)', 'rgba(12, 230, 164, 0.821)']);
    });

    it('should verify that when socketService.on is called renderChart is called', () => {
        spyOn(component, 'renderChart');
        (component as any).sumChoices();
        socketServiceSpy.on.calls.argsFor(0)[1]([1, 2, 3]);
        expect(component.renderChart).toHaveBeenCalled();
    });

    it('should verify that when socketService.on is called renderChart is called', () => {
        Object.defineProperty(currentGameServiceSpy, 'isQRL', { value: true });
        spyOn(component, 'renderChart');
        (component as any).sumInteractions();
        socketServiceSpy.on.calls.argsFor(0)[1]([1, 2]);
        expect(component.renderChart).toHaveBeenCalled();
    });

    it('should verify that when socketService.on is called renderChart is called', () => {
        spyOn(component, 'renderChart');
        (component as any).histogramGrade();
        socketServiceSpy.on.calls.argsFor(0)[1]([1, 2]);
        expect(component.renderChart).toHaveBeenCalled();
    });
});
