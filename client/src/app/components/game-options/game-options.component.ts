import { Component, inject, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { LangueService } from '@app/services/langues/langue.service';
import { RankingService } from '@app/services/ranking/ranking.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { CANCEL, CONFIRM, ENTRANCEFEE, LISTTYPEMODES, TITLE } from './constants';

@Component({
    selector: 'app-game-options',
    templateUrl: './game-options.component.html',
    styleUrls: ['./game-options.component.scss'],
})
export class GameOptionsComponent implements OnInit {
    listTypeMode: { name: string; image: string }[] = [];
    selectedModeValue: string | undefined = undefined;
    selectedPriceValue: number | undefined = undefined;
    currentUser: User | null;
    backgroundImage: string = '';
    titleLabel: string = '';
    entranceFeeLabel: string = '';
    confirmLabel: string = '';
    cancelLabel: string = '';
    rankModeLabel: string = '';
    classicModeLabel: string = '';
    friendsModeLabel: string = '';
    isAccessRanked: boolean = false;
    notQRLmessage: string = '';
    private dialogRef: MatDialogRef<GameOptionsComponent> = inject(MatDialogRef<GameOptionsComponent>);
    private authentificationService: AuthService = inject(AuthService);
    private themeService: ThemeService = inject(ThemeService);
    private socketService: SocketsService = inject(SocketsService);
    private languageService: LangueService = inject(LangueService);
    private rankingService: RankingService = inject(RankingService);

    async ngOnInit(): Promise<void> {
        this.currentUser = await this.authentificationService.getCurrentUser();
        if (this.currentUser) {
            this.isAccessRanked = this.rankingService.accessRanked;
            if (this.languageService.language === 'fra') {
                this.notQRLmessage = '*Uniquement pour QCM et QRE';
            } else {
                this.notQRLmessage = '*Only for QCM and QRE';
            }
            this.themeService.currentTheme(this.currentUser).subscribe((theme) => {
                this.backgroundImage = `url(${theme})`;
            });
            this.languageService.currentLanguage(this.currentUser).subscribe((language) => {
                this.updatedLabelLanguage(language);
            });
        }
        if (this.socketService.isSocketAlive()) {
            this.socketService.disconnect();
        }
        this.socketService.connect();
    }

    updatedLabelLanguage(language: string): void {
        this.listTypeMode = LISTTYPEMODES[language];
        this.titleLabel = TITLE[language];
        this.entranceFeeLabel = ENTRANCEFEE[language];
        this.confirmLabel = CONFIRM[language];
        this.cancelLabel = CANCEL[language];
    }

    selectedMode(event: MouseEvent): void {
        const element = event.currentTarget as HTMLElement;
        const modeName = element.innerText.trim();

        const selectedMode = this.listTypeMode.find((mode) => mode.name === modeName);
        if (!this.isAccessRanked && selectedMode?.image === 'fa-trophy') {
            return;
        }

        if (selectedMode) {
            this.selectedModeValue = selectedMode.image;
            const modes = document.querySelectorAll('.mode');
            modes.forEach((mode) => {
                mode.classList.remove('selected');
            });
            element.classList.add('selected');
        }
    }

    buttonClickedCreate(): void {
        if (this.selectedModeValue && this.currentUser) {
            if (this.selectedPriceValue === undefined) {
                this.selectedPriceValue = 0;
            }
            const options: { creator: string; mode: string; price: number } = {
                creator: this.currentUser?.username,
                mode: this.selectedModeValue,
                price: this.selectedPriceValue,
            };
            this.dialogRef.close(options);
        } else {
            throw new Error('Il manque une option.');
        }
    }

    numbersOnly(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const cleanValue = inputElement.value.replace(/[^0-9]/g, '');
        inputElement.value = cleanValue;
        this.selectedPriceValue = cleanValue ? Number(cleanValue) : undefined;
    }

    buttonClickedCancel(): void {
        this.dialogRef.close();
    }
}
