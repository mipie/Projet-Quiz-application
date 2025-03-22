import { TestBed } from '@angular/core/testing';
import { DialogsService } from './dialogs.service';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DialogComponent } from '@app/components/dialog/dialog.component';

describe('DialogsService', () => {
    let service: DialogsService;
    let mockMatDialog: jasmine.SpyObj<MatDialog>;

    beforeEach(() => {
        mockMatDialog = jasmine.createSpyObj('MatDialog', ['open']);

        TestBed.configureTestingModule({
            providers: [DialogsService, { provide: MatDialog, useValue: mockMatDialog }],
        });
        service = TestBed.inject(DialogsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('openInputDialog', () => {
        it('should open an input dialog and return the user input', async () => {
            const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
            const userInput = { code: 'some code', name: 'User input' };
            dialogRef.afterClosed.and.returnValue(of(userInput));

            mockMatDialog.open.and.returnValue(dialogRef);

            const messages = 'Please enter some text:';
            const inputPlaceholder = 'Type something here';
            const confirmButtonLabel = 'OK';

            const result = await service.openNameInputDialog(messages, inputPlaceholder, confirmButtonLabel);

            expect(mockMatDialog.open).toHaveBeenCalledWith(DialogComponent, {
                data: {
                    message: messages,
                    showConfirmButton: true,
                    showCancelButton: true,
                    showNameInput: true, // Corrected value
                    confirmButtonName: confirmButtonLabel,
                    cancelButtonName: 'Annuler',
                    nameInputPlaceHolder: inputPlaceholder, // Corrected value
                },
                disableClose: true, // Added value
            });

            expect(result).toBe(userInput);
        });
    });

    describe('openYesNoDialog', () => {
        it('should open a Yes/No dialog and return true for "Yes" and false for "No"', async () => {
            const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
            dialogRef.afterClosed.and.returnValue(of('Oui'));

            mockMatDialog.open.and.returnValue(dialogRef);

            const messages = 'Are you sure?';

            const resultYes = String(await service.openYesNoDialog(messages));

            expect(mockMatDialog.open).toHaveBeenCalledWith(DialogComponent, {
                data: {
                    message: messages,
                    showCancelButton: true,
                    showConfirmButton: true,
                    cancelButtonName: 'Non',
                    confirmButtonName: 'Oui!', // Corrected value
                },
            });

            expect(resultYes).toBe('Oui');

            dialogRef.afterClosed.and.returnValue(of('Non'));
            const resultNo = String(await service.openYesNoDialog(messages));

            expect(resultNo).toBe('Non');
        });
    });

    describe('openAlertDialog', () => {
        it('should open an alert dialog', async () => {
            const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
            dialogRef.afterClosed.and.returnValue(of(undefined));
            mockMatDialog.open.and.returnValue(dialogRef);

            const messages = 'This is an alert message';

            await service.openAlertDialog(messages);

            expect(mockMatDialog.open).toHaveBeenCalledWith(DialogComponent, {
                data: {
                    message: messages,
                    showConfirmButton: true,
                    confirmButtonName: 'Compris!', // Corrected value
                },
            });
        });
    });

    describe('openRedirectionDialog', () => {
        it('should open a redirection dialog', async () => {
            const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
            dialogRef.afterClosed.and.returnValue(of(undefined));

            mockMatDialog.open.and.returnValue(dialogRef);

            const messages = 'Do you want to redirect?';
            const redirectLink = 'https://example.com';

            await service.openRedirectionDialog(messages, redirectLink);

            expect(mockMatDialog.open).toHaveBeenCalledWith(DialogComponent, {
                data: {
                    message: messages,
                    showCancelButton: true,
                    showRedirectButton: true,
                    cancelButtonName: 'Non',
                    redirectButtonName: 'Oui!', // Corrected value
                    redirectTo: redirectLink,
                },
            });
        });
    });

    describe('openJoinGame', () => {
        it('should open a join game dialog', async () => {
            const expectedResult = { code: 'some code', name: '1234' };
            const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
            dialogRef.afterClosed.and.returnValue(of(expectedResult));

            mockMatDialog.open.and.returnValue(dialogRef);

            const actualResult = await service.openJoinGame();

            expect(mockMatDialog.open).toHaveBeenCalledWith(DialogComponent, {
                data: {
                    message: 'Code de la salle:',
                    showNameMessage: true,
                    nameMessage: 'Nom de joueur:',
                    showCodeInput: true,
                    codeInputValue: '',
                    inputPlaceHolder: 'Ex.: 8555',
                    showNameInput: true,
                    nameInputValue: '',
                    nameInputPlaceHolder: 'Ex.: KAM? PAM!',
                    showConfirmButton: true,
                    confirmButtonName: 'Entrer!',
                    showCancelButton: true,
                    cancelButtonName: 'Annuler',
                },
                disableClose: true,
            });

            expect(actualResult).toEqual(expectedResult);
        });
    });

    describe('openRedirectHome', () => {
        it('should open a redirection to home dialog and return true when redirected', async () => {
            const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
            dialogRef.afterClosed.and.returnValue(of('true'));

            mockMatDialog.open.and.returnValue(dialogRef);

            const messageLock = 'Do you want to redirect to home?';
            const buttonMessage = 'Yes';

            const result = await service.openRedirectHome(messageLock, buttonMessage);

            expect(mockMatDialog.open).toHaveBeenCalledWith(DialogComponent, {
                data: {
                    message: messageLock,
                    showRedirectButton: true,
                    redirectButtonName: buttonMessage,
                    redirectTo: 'home',
                },
                disableClose: true,
            });

            expect(result).toBe(true);
        });

        it('should open a redirection to home dialog and return false when not redirected', async () => {
            const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
            dialogRef.afterClosed.and.returnValue(of('false'));

            mockMatDialog.open.and.returnValue(dialogRef);

            const messageLock = 'Do you want to redirect to home?';
            const buttonMessage = 'No';

            const result = await service.openRedirectHome(messageLock, buttonMessage);

            expect(mockMatDialog.open).toHaveBeenCalledWith(DialogComponent, {
                data: {
                    message: messageLock,
                    showRedirectButton: true,
                    redirectButtonName: buttonMessage,
                    redirectTo: 'home',
                },
                disableClose: true,
            });

            expect(result).toBe(false);
        });
    });

    describe('openGiveUp', () => {
        it('should open a give-up dialog and return true when giving up', async () => {
            const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
            dialogRef.afterClosed.and.returnValue(of('true'));

            mockMatDialog.open.and.returnValue(dialogRef);

            const result = Boolean(await service.openGiveUp());

            expect(mockMatDialog.open).toHaveBeenCalledWith(DialogComponent, {
                data: {
                    message: 'Êtes-vous sûr de vouloir abandonner la partie?',
                    showConfirmButton: true,
                    showCancelButton: true,
                    confirmButtonName: 'Oui!', // Corrected value
                    cancelButtonName: 'Non',
                },
                disableClose: true,
            });

            expect(result).toBe(true);
        });
    });
});
