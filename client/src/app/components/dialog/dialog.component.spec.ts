/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogComponent, MatDialogData } from './dialog.component';
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MAX_NAME_INPUT_COUNT } from '@app/constants';
import { SoundService } from '@app/services/sound/sound.service';

describe('DialogComponent', () => {
    let component: DialogComponent;
    let fixture: ComponentFixture<DialogComponent>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<DialogComponent>>;
    let mockDialogData: MatDialogData;
    let songspyService: SoundService;

    beforeEach(async () => {
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
        mockDialogData = {
            message: 'Test Message',
            showNameMessage: false,
            nameMessage: '',
            showCodeInput: false,
            codeInputValue: '',
            inputPlaceHolder: '',
        };

        await TestBed.configureTestingModule({
            declarations: [DialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
        songspyService = TestBed.inject(SoundService);
        spyOn(songspyService, 'buttonClick').and.returnValue();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close dialog with input value when Enter key is pressed', () => {
        (mockDialogRef as any).componentInstance = {
            dialog: {
                inputValue: 'test value',
                message: '',
            },
        };
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        component.onKeydown(enterEvent);
        expect(mockDialogRef.close).toHaveBeenCalledWith(Object({ code: '', name: '' }));
    });

    describe('valueChange', () => {
        it('should update remainingTextCount correctly', () => {
            const initialValueLength = 5;
            component.valueChange('a'.repeat(initialValueLength));
            expect(component.remainingTextCount).toBe(MAX_NAME_INPUT_COUNT - initialValueLength);
        });
    });

    it('should call soundService.buttonClick on clickedButton', () => {
        component.buttonClicked();
        expect(songspyService.buttonClick).toHaveBeenCalled();
    });

    describe('verifyInput', () => {
        it('should return false when showCodeInput is true and codeInputValue is empty', () => {
            component.dialog = {
                showCodeInput: true,
                codeInputValue: 'some code',
                showNameInput: false,
                nameInputValue: '',
                message: '',
                showNameMessage: false,
                nameMessage: '',
            };
            expect(component.verifyInput()).toBe(true);
        });

        it('should return true when showCodeInput is true and codeInputValue is not empty', () => {
            component.dialog = {
                showCodeInput: true,
                codeInputValue: 'some code',
                showNameInput: false,
                nameInputValue: '',
                message: '',
                showNameMessage: false,
                nameMessage: '',
            };
            expect(component.verifyInput()).toBe(true);
        });
    });
    describe('verifyInput', () => {
        it('should return false when showNameInput is true and nameInputValue is empty', () => {
            component.dialog = {
                showCodeInput: false,
                codeInputValue: '',
                showNameInput: true,
                nameInputValue: '',
                message: '',
                showNameMessage: false,
                nameMessage: '',
            };
            expect(component.verifyInput()).toBe(false);
        });

        it('should return true when showNameInput is true and nameInputValue is not empty', () => {
            component.dialog = {
                showCodeInput: false,
                codeInputValue: '',
                showNameInput: true,
                nameInputValue: 'some name',
                message: '',
                showNameMessage: false,
                nameMessage: '',
            };
            expect(component.verifyInput()).toBe(true);
        });
    });
});
