/* eslint-disable deprecation/deprecation */
/* eslint-disable no-console */
import { Component, inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MAX_SIZE_IMAGE } from '@app/constants';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { AvatarService } from '@app/services/avatars/avatar.service';
import { LangueService } from '@app/services/langues/langue.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { UsernameService } from '@app/services/username/username.service';
import { Timestamp } from '@firebase/firestore';
import { map, Observable } from 'rxjs';
import {
    ACCOUNT,
    AVATAR,
    CONNECTION,
    CUSTOMIZATION,
    DISCONNECT,
    ENGLISH,
    ERRORALENGTH,
    ERRORALREADYUSED,
    ERROREMPTY,
    FRENCH,
    HISTORIC,
    HISTORICSECTION,
    HISTORYLABEL,
    LANGUAGESECTION,
    THEME,
    TITLE,
    USERNAME,
    USERNAMESECTION,
} from './constants';

@Component({
    selector: 'app-setting',
    templateUrl: './setting.component.html',
    styleUrls: ['./setting.component.scss'],
})
export class SettingComponent implements OnInit {
    currentUser: User | null;
    viewMode: string = 'Compte';
    historic: Timestamp[];
    avatarList: string[] = [];
    themeList: string[] = [];
    avatarSelected: string;
    themeSelected: string;
    errorSizeImage: string | null = '';
    backgroundImage: string = '';
    isLanguageToggle: boolean = false;
    isEditingUsername: boolean = false;
    editedUsername: string = '';
    allExistantUsernames: string[];
    errorEmptyLabel: string = '';
    isErrorEmpty: boolean = false;
    errorAlreadyUseLabel: string = '';
    isErrorAlreadyUsed: boolean = false;
    errorLength: string = '';
    isErrorLength: boolean = false;
    messageError: string = '';
    titleLabel: string = '';
    accountLabel: string = '';
    customizationLabel: string = '';
    historicLabel: string = '';
    usernameSectionLabel: string = '';
    usernameLabel: string = '';
    languageSectionLabel: string = '';
    frenchLabel: string = '';
    englishLabel: string = '';
    themeSectionLabel: string = '';
    avatarsSectionLabel: string = '';
    historicSectionLabel: string = '';
    connectionLabel: string = '';
    disconnectLabel: string = '';
    historyLabel: string = '';
    private authentificationService: AuthService = inject(AuthService);
    private fireStore: AngularFirestore = inject(AngularFirestore);
    private avatarService: AvatarService = inject(AvatarService);
    private themeService: ThemeService = inject(ThemeService);
    private languageService: LangueService = inject(LangueService);
    private usernameService: UsernameService = inject(UsernameService);

    async ngOnInit(): Promise<void> {
        this.currentUser = await this.authentificationService.getCurrentUser();
        if (this.currentUser) {
            this.displayAvatarList(this.currentUser);
            this.displayThemeList(this.currentUser);
            this.historicList(this.currentUser).subscribe((time) => {
                this.historic = time;
                this.historic.sort((a, b) => b.toDate().getTime() - a.toDate().getTime());
            });
            this.themeService.currentTheme(this.currentUser).subscribe((theme) => {
                this.themeSelected = theme;
                this.avatarSelected = this.currentUser!.avatar.currentAvatar;
                this.backgroundImage = `url(${theme})`;
            });
            this.languageService.currentLanguage(this.currentUser).subscribe((language) => {
                this.updatedLabelLanguage(language);
                this.isLanguageToggle = language === 'eng';
            });
            this.usernameService.username(this.currentUser).subscribe((newUsername) => {
                if (this.currentUser) {
                    this.currentUser.username = newUsername;
                }
            });
            this.usernameService.getAllUsers().subscribe((users) => {
                this.allExistantUsernames = users.filter((user) => user.username !== this.currentUser?.username).map((user) => user.username);
            });
        }
    }

    updatedLabelLanguage(language: string): void {
        this.historyLabel = HISTORYLABEL[language];
        this.titleLabel = TITLE[language];
        this.accountLabel = ACCOUNT[language];
        this.customizationLabel = CUSTOMIZATION[language];
        this.historicLabel = HISTORIC[language];
        this.usernameSectionLabel = USERNAMESECTION[language];
        this.usernameLabel = USERNAME[language];
        this.languageSectionLabel = LANGUAGESECTION[language];
        this.frenchLabel = FRENCH[language];
        this.englishLabel = ENGLISH[language];
        this.themeSectionLabel = THEME[language];
        this.avatarsSectionLabel = AVATAR[language];
        this.historicSectionLabel = HISTORICSECTION[language];
        this.connectionLabel = CONNECTION[language];
        this.disconnectLabel = DISCONNECT[language];
        this.errorEmptyLabel = ERROREMPTY[language];
        this.errorAlreadyUseLabel = ERRORALREADYUSED[language];
        this.errorLength = ERRORALENGTH[language];
    }

    viewModeSection(sectionToDisplay: string): void {
        this.viewMode = sectionToDisplay;
    }

    onAvatarClick(avatarUrl: string): void {
        this.avatarSelected = avatarUrl;
        if (this.currentUser) {
            this.currentUser.avatar.currentAvatar = avatarUrl;
            this.avatarService.changeUserAvatar(this.currentUser.avatar, this.currentUser);
            this.avatarService.changeUserAvatarMessage(this.currentUser.avatar, this.currentUser);
        }
    }

    onclickUploadAvatar(fileInput: HTMLInputElement): void {
        fileInput.click();
    }

    async onFileSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;

        if (input.files && input.files[0]) {
            const file = input.files[0];

            if (file.size > MAX_SIZE_IMAGE) {
                this.errorSizeImage = "La taille de l'image dépasse la limite maximal de 1 MB.";
                return;
            }

            const url = await this.avatarService.uploadAvatar(file);
            if (this.currentUser) {
                this.currentUser.avatar.availableAvatars.push(url);
                this.avatarService.changeUserAvatar(this.currentUser.avatar, this.currentUser);
            }

            this.errorSizeImage = null;
        }
    }

    onThemeClick(themeUrl: string): void {
        if (this.currentUser) {
            this.themeSelected = themeUrl;
            this.currentUser.theme.currentTheme = themeUrl;
            this.themeService.changeUserTheme(this.currentUser.theme, this.currentUser);
        }
    }

    onLanguageClick(): void {
        if (this.currentUser) {
            const language = this.isLanguageToggle ? 'eng' : 'fra';
            this.languageService.changeUserLanguage(language, this.currentUser);
        }
    }

    async onUsernameClick(): Promise<void> {
        const maxUsernameLength = 12;
        if (this.currentUser) {
            this.editedUsername = this.editedUsername.replace(/\s+/g, '');
            if (!this.editedUsername.trim()) {
                this.isErrorEmpty = true;
                this.isErrorAlreadyUsed = false;
                this.isErrorLength = false;
                this.messageError = this.errorEmptyLabel;
            } else if (this.allExistantUsernames.includes(this.editedUsername)) {
                this.isErrorAlreadyUsed = true;
                this.isErrorEmpty = false;
                this.isErrorLength = false;
                this.messageError = this.errorAlreadyUseLabel;
            } else if (this.editedUsername.length > maxUsernameLength) {
                this.isErrorLength = true;
                this.isErrorEmpty = false;
                this.isErrorAlreadyUsed = false;
                this.messageError = this.errorLength;
            } else {
                this.messageError = '';
                this.isEditingUsername = false;
                await this.usernameService.changeUserUsernameMessage(this.editedUsername, this.currentUser);
                await this.usernameService.changeUserUsername(this.currentUser, this.editedUsername);
            }
        }
    }

    triggerEditUsername(event: Event): void {
        event.stopPropagation();
        this.isEditingUsername = true;
    }
    preventPropagation(event: Event): void {
        event.stopPropagation();
    }
    historicList(currentUser: User): Observable<Timestamp[]> {
        return this.fireStore
            .collection<User>('users')
            .doc(currentUser.uid)
            .valueChanges()
            .pipe(
                map((user) => {
                    if (user?.historic) {
                        return user.historic;
                    } else {
                        return [];
                    }
                }),
            );
    }

    displayAvatarList(currentUser: User): void {
        this.avatarService.avatarList(currentUser).subscribe((list) => {
            this.avatarList = list;
        });
    }

    displayThemeList(currentUser: User): void {
        this.themeService.themeList(currentUser).subscribe((list) => {
            this.themeList = list;
        });
    }
}
