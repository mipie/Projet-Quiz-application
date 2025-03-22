/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { AvatarService } from '@app/services/avatars/avatar.service';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { ExperienceService } from '@app/services/experience/experience.service';
import { FriendsService } from '@app/services/friends/friends.service';
import { LangueService } from '@app/services/langues/langue.service';
import { UsernameService } from '@app/services/username/username.service';
import { WalletService } from '@app/services/wallet/wallet.service';
import { FRIENDS, LEVEL, LOGOUT, SETTINGS, STATISTICS, STORE } from './constants';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
    @Input() isDropDownMenu: boolean = false;
    @Output() isDropDownMenuChange: EventEmitter<boolean> = new EventEmitter();
    currentUser: User | null;
    numberFriendNotifications: number;
    currentUserAvatar: string = '';
    friendsLabel: string = '';
    storeLabel: string = '';
    statisticsLabel: string = '';
    settingsLabel: string = '';
    logoutLabel: string = '';
    lvlLabel: string = '';
    lvlValue: number = 0;
    xpValue: number = 0;
    wallet: number = 0;
    private dialogs: DialogsService = inject(DialogsService);
    private authentificationService: AuthService = inject(AuthService);
    private friendService: FriendsService = inject(FriendsService);
    private avatarService: AvatarService = inject(AvatarService);
    private langueService: LangueService = inject(LangueService);
    private usernameService: UsernameService = inject(UsernameService);
    private experienceService: ExperienceService = inject(ExperienceService);
    private walletService: WalletService = inject(WalletService);

    async ngOnInit(): Promise<void> {
        this.currentUser = await this.authentificationService.getCurrentUser();
        if (this.currentUser) {
            this.getAvatarUrl();
            this.avatarService.updateAvatar(this.currentUser).subscribe((avatar) => {
                this.currentUserAvatar = avatar;
            });
            this.friendService.requestsList(this.currentUser).subscribe((requests) => {
                this.numberFriendNotifications = requests.length;
            });
            this.langueService.currentLanguage(this.currentUser).subscribe((language) => {
                this.updatedLabelLanguage(language);
            });
            this.usernameService.username(this.currentUser).subscribe((username) => {
                if (this.currentUser) {
                    this.currentUser.username = username;
                }
            });
            this.walletService.currentWallet(this.currentUser).subscribe((wallet) => {
                this.wallet = wallet;
            });
            this.experienceService.updateXpGained(this.currentUser).subscribe((xpGained) => {
                this.experienceService.gainLevel(xpGained);
                this.lvlValue = this.experienceService.lvlValue;
                this.xpValue = this.experienceService.xpValue;
            });
        }
    }

    updatedLabelLanguage(language: string): void {
        this.friendsLabel = FRIENDS[language];
        this.storeLabel = STORE[language];
        this.statisticsLabel = STATISTICS[language];
        this.settingsLabel = SETTINGS[language];
        this.logoutLabel = LOGOUT[language];
        this.lvlLabel = LEVEL[language];
    }

    getAvatarUrl(): void {
        if (this.currentUser) {
            this.currentUserAvatar = this.currentUser?.avatar.currentAvatar;
        }
    }

    dropDownMenu(): void {
        this.isDropDownMenu = !this.isDropDownMenu;
        this.isDropDownMenuChange.emit(this.isDropDownMenu);
    }

    buttonAddFriends(): void {
        this.dialogs.openAddFriends();
    }

    buttonStatistics(): void {
        this.dialogs.openStatistics();
    }

    buttonShop(): void {
        this.dialogs.openShop();
    }

    buttonSettings(): void {
        this.dialogs.openSettings();
    }

    buttonLogOut(): void {
        this.authentificationService.logout();
    }
}
