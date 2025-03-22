import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SoundService } from '@app/services/sound/sound.service';

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;
    let soundServiceSpy: jasmine.SpyObj<SoundService>;

    beforeEach(() => {
        soundServiceSpy = jasmine.createSpyObj('SoundService', ['buttonClick', 'toggleActivateButtonSound']);

        TestBed.configureTestingModule({
            declarations: [HeaderComponent],
            providers: [{ provide: SoundService, useValue: soundServiceSpy }],
            imports: [RouterTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        });
        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle button click sound', () => {
        soundServiceSpy.toggleActivateButtonSound.and.returnValue(true);
        component.toggleButtonClickSound();
        expect(component.activateButtonSound).toBeTrue();
    });
});
