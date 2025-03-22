import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '@app/components/dialog/dialog.component';
import { EvaluationComponent } from '@app/components/evaluation/evaluation.component';
import { ExperienceBarComponent } from '@app/components/experience-bar/experience-bar.component';
import { FriendComponent } from '@app/components/friend/friend.component';
import { GameOptionsComponent } from '@app/components/game-options/game-options.component';
import { SettingComponent } from '@app/components/setting/setting.component';
import { ShopComponent } from '@app/components/shop/shop.component';
import { StatisticComponent } from '@app/components/statistic/statistic.component';
import { Player } from '@app/interfaces/player/player';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { LangueService } from '@app/services/langues/langue.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DialogsService {
    currentUser: User | null;
    players: Player[];
    private dialog: MatDialog = inject(MatDialog);
    private languageService: LangueService = inject(LangueService);
    private authentificationService: AuthService = inject(AuthService);

    async openNameInputDialog(
        messageToShow: string,
        inputPlaceHolderToShow: string,
        nameConfirmButton: string,
    ): Promise<{
        code: string;
        name: string;
    }> {
        const labels = this.getLabels();
        const dialogRef = this.dialog.open(DialogComponent, {
            data: {
                message: messageToShow,
                showConfirmButton: true,
                confirmButtonName: nameConfirmButton,
                showCancelButton: true,
                cancelButtonName: labels.cancel,
                showNameInput: true,
                nameInputPlaceHolder: inputPlaceHolderToShow,
            },
        });
        return lastValueFrom(dialogRef.afterClosed());
    }

    async openYesNoDialog(messageToShow: string): Promise<boolean> {
        const labels = this.getLabels();
        const dialogRef = this.dialog.open(DialogComponent, {
            data: {
                message: messageToShow,
                showCancelButton: true,
                cancelButtonName: labels.cancel,
                showConfirmButton: true,
                confirmButtonName: labels.confirm,
            },
        });
        return lastValueFrom(dialogRef.afterClosed());
    }

    async openAlertDialog(messageToShow: string): Promise<void> {
        const labels = this.getLabels();
        this.dialog.open(DialogComponent, {
            data: {
                message: messageToShow,
                showConfirmButton: true,
                confirmButtonName: labels.messageUnderstood,
            },
        });
    }

    async openRedirectionDialog(messageToShow: string, redirectLink: string): Promise<void> {
        const labels = this.getLabels();
        this.dialog.open(DialogComponent, {
            data: {
                message: messageToShow,
                showCancelButton: true,
                cancelButtonName: labels.cancel,
                showRedirectButton: true,
                redirectButtonName: labels.confirm,
                redirectTo: redirectLink,
            },
        });
    }

    async openJoinGame(): Promise<{ code: string; name: string }> {
        const labels = this.getLabels();
        const dialogRef = this.dialog.open(DialogComponent, {
            data: {
                message: labels.messageRoom,
                showCodeInput: true,
                codeInputValue: '',
                inputPlaceHolder: 'Ex.: 8555',
                showConfirmButton: true,
                confirmButtonName: labels.confirm,
                showCancelButton: true,
                cancelButtonName: labels.cancel,
            },
        });
        return lastValueFrom(dialogRef.afterClosed());
    }

    async openRedirectHome(messageLock: string, buttonMessage: string): Promise<boolean> {
        const dialogRef = this.dialog.open(DialogComponent, {
            data: {
                message: messageLock,
                showRedirectButton: true,
                redirectButtonName: buttonMessage,
                redirectTo: 'home',
            },
        });
        return (await lastValueFrom(dialogRef.afterClosed())) === 'true';
    }

    async openRedirectLobbies(messageLock: string, buttonMessage: string): Promise<boolean> {
        const dialogRef = this.dialog.open(DialogComponent, {
            data: {
                message: messageLock,
                showRedirectButton: true,
                redirectButtonName: buttonMessage,
                redirectTo: 'lobbies',
            },
        });
        return (await lastValueFrom(dialogRef.afterClosed())) === 'true';
    }

    async openGiveUp(message?: string): Promise<boolean> {
        const labels = this.getLabels();
        const dialogRef = this.dialog.open(DialogComponent, {
            data: {
                message: message? message : labels.messageAbandon,
                showConfirmButton: true,
                confirmButtonName: labels.confirm,
                showCancelButton: true,
                cancelButtonName: labels.cancel,
            },
        });
        return lastValueFrom(dialogRef.afterClosed());
    }

    async openAddFriends(): Promise<void> {
        this.dialog.open(FriendComponent, {
            autoFocus: false,
            maxHeight: '95vh',
            panelClass: 'to-scroll-dialog',
        });
    }

    async openStatistics(): Promise<void> {
        this.dialog.open(StatisticComponent, {
            autoFocus: false,
            maxHeight: '95vh',
            panelClass: 'to-scroll-dialog',
        });
    }

    async openShop(): Promise<void> {
        this.dialog.open(ShopComponent, {
            autoFocus: false,
            maxHeight: '95vh',
            panelClass: 'to-scroll-dialog',
        });
    }

    async openSettings(): Promise<void> {
        this.dialog.open(SettingComponent, {
            autoFocus: false,
            maxHeight: '95vh',
            panelClass: 'to-scroll-dialog',
        });
    }

    async openGameOptions(): Promise<{ creator: string; mode: string; price: number } | undefined> {
        const dialogRef = this.dialog.open(GameOptionsComponent, {
            autoFocus: false,
            maxHeight: '95vh',
            panelClass: 'to-scroll-dialog',
        });

        const options: { creator: string; mode: string; price: number } = await lastValueFrom(dialogRef.afterClosed());
        if (options) {
            return options;
        }

        return undefined;
    }

    async openExperienceDialog(players: Player[]): Promise<void> {
        this.currentUser = await this.authentificationService.getCurrentUser();
        for (const player of players) {
            if (this.currentUser && this.currentUser.username === player.name) {
                this.dialog.open(ExperienceBarComponent, {
                    autoFocus: false,
                    panelClass: 'to-scroll-dialog',
                });
            }
        }
    }

    async openEvaluationDialog() {
        this.dialog.open(EvaluationComponent, {
            autoFocus: false,
            maxHeight: '95vh',
            panelClass: 'to-scroll-dialog',
        });
    }

    private getLabels(): { messageRoom: string; messageAbandon: string; messageUnderstood: string; confirm: string; cancel: string } {
        const language = this.languageService.language;
        return language === 'fra'
            ? {
                messageRoom: 'Code de la salle:',
                messageAbandon: 'Êtes-vous sûr de vouloir abandonner la partie?',
                messageUnderstood: 'Compris',
                confirm: 'Confirmer',
                cancel: 'Annuler',
            }
            : {
                messageRoom: 'Code of the room:',
                messageAbandon: 'Are you sure you want to give up the game?',
                messageUnderstood: 'Understood',
                confirm: 'Confirm',
                cancel: 'Cancel',
            };
    }
}
