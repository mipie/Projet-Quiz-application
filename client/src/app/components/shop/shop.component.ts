/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Component, inject, OnInit } from '@angular/core';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { LangueService } from '@app/services/langues/langue.service';
import { ShopService } from '@app/services/shop/shop.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { AVATARS, NOTENOUGH, PICKITEM, PURCHASED, STORE, THEMES } from './constants';

@Component({
    selector: 'app-shop',
    templateUrl: './shop.component.html',
    styleUrls: ['./shop.component.scss'],
})
export class ShopComponent implements OnInit {
    currentUser: User | null;
    backgroundImage: string = '';
    priceItem: number = 100;
    isAvatarBought: boolean = false;
    isThemeBought: boolean = false;
    avatarSelected: string;
    themeSelected: string;
    itemSelected: string;
    titleLabel: string = '';
    avatarsLabel: string = '';
    purchased: string;
    themesLabel: string = '';
    pickItemLabel: string = '';
    notEnoughLabel: string = '';
    private dialogsService: DialogsService = inject(DialogsService);
    private authentificationService: AuthService = inject(AuthService);
    private themeService: ThemeService = inject(ThemeService);
    private languageService: LangueService = inject(LangueService);
    private shopService: ShopService = inject(ShopService);

    get avatarList(): string[] {
        return this.shopService.avatarUrl;
    }

    get themeList(): string[] {
        return this.shopService.themeUrl;
    }

    async ngOnInit(): Promise<void> {
        this.currentUser = await this.authentificationService.getCurrentUser();
        if (this.currentUser) {
            this.shopService.loadAvatarsCreation();
            this.shopService.loadThemesCreation();
            this.themeService.currentTheme(this.currentUser).subscribe((theme) => {
                this.backgroundImage = `url(${theme})`;
            });
            this.languageService.currentLanguage(this.currentUser).subscribe((language) => {
                this.updatedLabelLanguage(language);
            });
            this.shopService.currentWallet(this.currentUser).subscribe((wallet) => {
                if (this.currentUser) {
                    this.currentUser.wallet = wallet;
                }
            });
        }
    }

    updatedLabelLanguage(language: string): void {
        this.purchased = PURCHASED[language];
        this.titleLabel = STORE[language];
        this.avatarsLabel = AVATARS[language];
        this.themesLabel = THEMES[language];
        this.pickItemLabel = PICKITEM[language];
        this.notEnoughLabel = NOTENOUGH[language];
    }

    onAvatarClick(avatarUrl: string): void {
        this.avatarSelected = avatarUrl;
        this.themeSelected = '';
        this.itemSelected = this.avatarSelected;
    }

    onThemeClick(themeUrl: string): void {
        this.themeSelected = themeUrl;
        this.avatarSelected = '';
        this.itemSelected = this.themeSelected;
    }

    buyItem(): void {
        if (this.currentUser) {
            if (!this.itemSelected) {
                this.openMessage(this.pickItemLabel);
            } else {
                if (this.currentUser.wallet < this.priceItem) {
                    this.openMessage(this.notEnoughLabel);
                } else {
                    if (this.itemSelected && this.avatarSelected) {
                        this.shopService.buyAvatar(this.currentUser, this.avatarSelected, this.priceItem);
                        this.isAvatarBought = this.isAvatarAlreadyBuy(this.avatarSelected);
                        this.avatarSelected = '';
                    } else if (this.itemSelected && this.themeSelected) {
                        this.shopService.buyTheme(this.currentUser, this.themeSelected, this.priceItem);
                        this.isThemeBought = this.isThemeAlreadyBuy(this.themeSelected);
                        this.themeSelected = '';
                    }
                }
            }
        }
    }

    isAvatarAlreadyBuy(avatarUrl: string): boolean {
        if (this.currentUser?.avatar.availableAvatars.includes(avatarUrl)) {
            return true;
        }
        return false;
    }

    isThemeAlreadyBuy(themeUrl: string): boolean {
        if (this.currentUser?.theme.availableThemes.includes(themeUrl)) {
            return true;
        }
        return false;
    }

    private async openMessage(message: string): Promise<void> {
        await this.dialogsService.openAlertDialog(message);
    }
}
