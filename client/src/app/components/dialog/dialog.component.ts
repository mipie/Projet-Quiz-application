import { Component, HostListener, inject, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MAX_NAME_INPUT_COUNT } from '@app/constants';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { SoundService } from '@app/services/sound/sound.service';
import { ThemeService } from '@app/services/themes/theme.service';

export interface MatDialogData {
    message: string;

    showNameMessage: boolean;
    nameMessage: string;

    showCodeInput?: boolean;
    codeInputValue?: string;
    inputPlaceHolder?: string;

    showNameInput?: boolean;
    nameInputValue?: string;
    nameInputPlaceHolder?: string;

    showCancelButton?: boolean;
    showConfirmButton?: boolean;
    showRedirectButton?: boolean;

    cancelButtonName?: string;
    confirmButtonName?: string;
    redirectButtonName?: string;
    redirectTo?: string;
}

@Component({
    selector: 'app-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.scss'],
})
export class DialogComponent implements OnInit {
    remainingTextCount: number = MAX_NAME_INPUT_COUNT;
    currentUser: User | null;
    backgroundImage: string = '';
    private authentificationService: AuthService = inject(AuthService);
    private themeService: ThemeService = inject(ThemeService);

    // eslint-disable-next-line complexity
    constructor(
        private soundService: SoundService,
        public dialogRef: MatDialogRef<DialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dialog: MatDialogData,
    ) {
        this.dialog = {
            message: this.dialog.message,

            showNameMessage: this.dialog.showNameMessage || false,
            nameMessage: this.dialog.nameMessage || '',

            showCodeInput: this.dialog.showCodeInput || false,
            codeInputValue: this.dialog.codeInputValue || '',
            inputPlaceHolder: this.dialog.inputPlaceHolder || 'Entrez une valeur',

            showNameInput: this.dialog.showNameInput || false,
            nameInputValue: this.dialog.nameInputValue || '',
            nameInputPlaceHolder: this.dialog.nameInputPlaceHolder || 'Entrez une valeur',

            showCancelButton: this.dialog.showCancelButton || false,
            showConfirmButton: this.dialog.showConfirmButton || false,
            showRedirectButton: this.dialog.showRedirectButton || false,

            cancelButtonName: this.dialog.cancelButtonName || 'Annuler',
            confirmButtonName: this.dialog.confirmButtonName || 'Confirmer',
            redirectButtonName: this.dialog.redirectButtonName || 'Retour',
            redirectTo: this.dialog.redirectTo || '',
        };
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && this.verifyInput()) this.dialogRef.close({ code: this.dialog.codeInputValue, name: this.dialog.nameInputValue });
    }

    async ngOnInit(): Promise<void> {
        this.currentUser = await this.authentificationService.getCurrentUser();
        if (this.currentUser) {
            this.themeService.currentTheme(this.currentUser).subscribe((theme) => {
                this.backgroundImage = `url(${theme})`;
            });
        }
    }

    verifyInput(): boolean {
        let isInputValid = true;
        isInputValid &&= this.dialog.showCodeInput ? this.dialog.codeInputValue !== '' : true;
        isInputValid &&= this.dialog.showNameInput ? this.dialog.nameInputValue !== '' : true;
        return isInputValid;
    }

    valueChange(value: string) {
        this.remainingTextCount = MAX_NAME_INPUT_COUNT - value.length;
    }

    buttonClicked(): void {
        this.soundService.buttonClick();
    }
}
