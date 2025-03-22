import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultatsComponent } from './resultats.component';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { Router } from '@angular/router';
import { RoomService } from '@app/services/room-game/room.service';
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Question } from '@app/interfaces/question/question';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { SoundService } from '@app/services/sound/sound.service';
import { HistogramData } from '@app/interfaces/histogramData/histogram-data';
import { HistogramService } from '@app/services/histogram/histogram.service';

describe('ResultatsComponent', () => {
    let component: ResultatsComponent;
    let fixture: ComponentFixture<ResultatsComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let roomServiceSpy: jasmine.SpyObj<RoomService>;
    let socketsServiceSpy: jasmine.SpyObj<SocketsService>;
    let dialogsServiceSpy: jasmine.SpyObj<DialogsService>;
    let currentGameServiceSpy: jasmine.SpyObj<CurrentGameService>;
    let histogramServiceSpy: jasmine.SpyObj<HistogramService>;
    let songspyService: SoundService;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        roomServiceSpy = jasmine.createSpyObj('RoomService', ['code']);
        socketsServiceSpy = jasmine.createSpyObj('SocketsService', ['send', 'on']);
        dialogsServiceSpy = jasmine.createSpyObj('DialogsService', ['openRedirectHome']);
        currentGameServiceSpy = jasmine.createSpyObj('CurrentGameService', [
            'question',
            'questionIndex',
            'nextHistogram',
            'previousHistogram',
            'firstHistogram',
            'lastHistogram',
            'updateHistogram',
        ]);
        histogramServiceSpy = jasmine.createSpyObj('HistogramService', ['updateHistogram']);

        TestBed.configureTestingModule({
            declarations: [ResultatsComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: RoomService, useValue: roomServiceSpy },
                { provide: SocketsService, useValue: socketsServiceSpy },
                { provide: DialogsService, useValue: dialogsServiceSpy },
                { provide: CurrentGameService, useValue: currentGameServiceSpy },
                { provide: HistogramService, useValue: histogramServiceSpy },
                SoundService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        });
        currentGameServiceSpy.question = new Question();
        fixture = TestBed.createComponent(ResultatsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        songspyService = TestBed.inject(SoundService);
        spyOn(songspyService, 'buttonClick').and.returnValue();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to home if room code is not set', () => {
        const router = TestBed.inject(Router);
        routerSpy.navigate.and.returnValue(Promise.resolve(true));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component['room'].code = undefined as any;
        component.ngOnInit();
        expect(router.navigate).toHaveBeenCalledWith(['home']);
    });

    it('should not navigate to home if room code is set', () => {
        const router = TestBed.inject(Router);
        routerSpy.navigate.and.returnValue(Promise.resolve(false));
        component['room'].code = 'test';
        component.ngOnInit();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should set up socketUsers listener on ngOnInit', () => {
        const histogramData = [new HistogramData()];
        socketsServiceSpy.on.and.callFake((event, callback) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            callback(histogramData as any);
        });
        histogramServiceSpy.updateHistogram.and.returnValue();
        currentGameServiceSpy.firstHistogram.and.returnValue();
        component.ngOnInit();
        expect(socketsServiceSpy.on).toHaveBeenCalledWith('sendHistogram', jasmine.any(Function));
        expect(component.histogramData).toBe(histogramData);
        expect(component['histogramService'].updateHistogram).toHaveBeenCalledWith(histogramData[0]);
        expect(component['currentService'].firstHistogram).toHaveBeenCalled();
    });

    describe('ResultatsComponent', () => {
        it('should increment histogramDataIndex on nextHistogram', () => {
            component.histogramData = [new HistogramData(), new HistogramData()];
            component.nextHistogram();
            expect(component.histogramDataIndex).toBe(1);
        });

        it('should decrement histogramDataIndex on previousHistogram', () => {
            component.histogramData = [new HistogramData(), new HistogramData()];
            component.histogramDataIndex = 1;
            component.previousHistogram();
            expect(component.histogramDataIndex).toBe(0);
        });

        it('should set isLast and isFirst correctly on setIsLastIsFirst', () => {
            component.histogramData = [new HistogramData(), new HistogramData()];
            component.histogramDataIndex = 0;
            component.setIsLastIsFirst();
            expect(component.isFirst).toBe(true);
            expect(component.isLast).toBe(false);

            component.histogramDataIndex = 1;
            component.setIsLastIsFirst();
            expect(component.isFirst).toBe(false);
            expect(component.isLast).toBe(true);
        });

        it('should call soundService.buttonClick on buttonClick', () => {
            component.buttonClick();
            expect(songspyService.buttonClick).toHaveBeenCalled();
        });

        it('should call dialogs.openRedirectHome on goToHome', async () => {
            const dialogs = TestBed.inject(DialogsService);
            dialogsServiceSpy.openRedirectHome.and.returnValue(Promise.resolve(true));
            await component.goToHome();
            expect(dialogs.openRedirectHome).toHaveBeenCalled();
        });
    });
});
