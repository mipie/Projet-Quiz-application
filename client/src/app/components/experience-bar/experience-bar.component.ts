/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Component, inject, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { AvatarService } from '@app/services/avatars/avatar.service';
import { ExperienceService } from '@app/services/experience/experience.service';
import { LangueService } from '@app/services/langues/langue.service';
import { RankingService } from '@app/services/ranking/ranking.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { WalletService } from '@app/services/wallet/wallet.service';
import { LEVEL } from './constants';
@Component({
    selector: 'app-experience-bar',
    templateUrl: './experience-bar.component.html',
    styleUrls: ['./experience-bar.component.scss'],
})
export class ExperienceBarComponent implements OnInit {
    currentUser: User | null;
    wallet: number;
    moneyWon: number;
    rankingPoints: number;
    rankingPointsWon: number;
    experienceWon: number;
    currentUserAvatar: string = '';
    lvlValue: number = 0;
    xpValue: number = 0;
    lvlLabel: string = '';
    backgroundImage: string = '';
    private authentificationService: AuthService = inject(AuthService);
    private avatarService: AvatarService = inject(AvatarService);
    private experienceService: ExperienceService = inject(ExperienceService);
    private langueService: LangueService = inject(LangueService);
    private themeService: ThemeService = inject(ThemeService);
    private walletService: WalletService = inject(WalletService);
    private rankingService: RankingService = inject(RankingService);
    private dialogRef: MatDialogRef<ExperienceBarComponent> = inject(MatDialogRef<ExperienceBarComponent>);

    async ngOnInit(): Promise<void> {
        this.backgroundImage = `url(${this.themeService.theme})`;
        this.currentUser = await this.authentificationService.getCurrentUser();
        if (this.currentUser) {
            this.getAvatarUrl();
            this.avatarService.updateAvatar(this.currentUser).subscribe((avatar) => {
                this.currentUserAvatar = avatar;
            });
            this.langueService.currentLanguage(this.currentUser).subscribe((language) => {
                this.updatedLabelLanguage(language);
            });
            this.walletService.currentWallet(this.currentUser).subscribe((wallet) => {
                if (this.currentUser) {
                    this.wallet = wallet;
                    this.moneyWon = this.wallet - this.currentUser.wallet;
                }
            });
            this.rankingService.currentRankingPoints(this.currentUser).subscribe((rankingPoints) => {
                if (this.currentUser) {
                    this.rankingPoints = rankingPoints;
                    this.rankingPointsWon = this.rankingPoints - this.currentUser.rankingPoints;
                }
            });
            this.experienceService.updateXpGained(this.currentUser).subscribe((xpGained) => {
                if (this.currentUser) {
                    this.experienceService.gainLevel(xpGained);
                    this.lvlValue = this.experienceService.lvlValue;
                    this.xpValue = this.experienceService.xpValue;
                    this.experienceWon = xpGained - this.currentUser?.experience;
                }
            });
        }
    }

    getAvatarUrl(): void {
        if (this.currentUser) {
            this.currentUserAvatar = this.currentUser?.avatar.currentAvatar;
        }
    }

    updatedLabelLanguage(language: string): void {
        this.lvlLabel = LEVEL[language];
    }

    buttonClose(): void {
        this.dialogRef.close();
    }
}
