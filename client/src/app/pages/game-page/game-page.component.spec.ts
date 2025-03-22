/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { GamePageComponent } from './game-page.component';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { Router } from '@angular/router';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let router: Router;
    let socketsService: jasmine.SpyObj<SocketsService>;

    beforeEach(async () => {
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const socketsServiceSpy = jasmine.createSpyObj('SocketsService', ['on', 'send']);

        await TestBed.configureTestingModule({
            declarations: [GamePageComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: SocketsService, useValue: socketsServiceSpy },
            ],
            schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        socketsService = TestBed.inject(SocketsService) as jasmine.SpyObj<SocketsService>;
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to results on redirectResult event', () => {
        const response = true;
        socketsService.on.and.callFake((event, callback) => {
            if (event === 'redirectResult') {
                callback(response as any);
            }
        });
        component.ngOnInit();
        expect(router.navigate).toHaveBeenCalled();
    });
});
