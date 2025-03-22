import { Component, inject, OnInit } from '@angular/core';
import { User, UserInfo } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { FriendsService } from '@app/services/friends/friends.service';
import { LangueService } from '@app/services/langues/langue.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { FRIENDSECTION, NOFRIENDS, NOFRIENDSREQ, REQUESTSSECTION, SEARCHBAR, SEARCHSECTION, TITLE, YOURFRIENDS } from './constants';

@Component({
    selector: 'app-friend',
    templateUrl: './friend.component.html',
    styleUrls: ['./friend.component.scss'],
})
export class FriendComponent implements OnInit {
    viewMode: string = 'friends';
    searchInput: string = '';
    backgroundImage: string = '';
    numberFriendNotifications: number;
    usersList: User[] = [];
    friendsList: UserInfo[] = [];
    requestsList: UserInfo[] = [];
    friendsLabel: string = '';
    searchLabel: string = '';
    requestLabel: string = '';
    searchbarLabel: string = '';
    yourFriends: string;
    noFriends: string;
    title: string;
    noFriendsReq: string;
    private currentUser: User | null;
    private authentificationService: AuthService = inject(AuthService);
    private friendsService: FriendsService = inject(FriendsService);
    private themeService: ThemeService = inject(ThemeService);
    private languageService: LangueService = inject(LangueService);

    async ngOnInit(): Promise<void> {
        this.currentUser = await this.authentificationService.getCurrentUser();
        if (this.currentUser) {
            this.friendsService.requestsList(this.currentUser).subscribe((requests) => {
                this.numberFriendNotifications = requests.length;
            });
            this.themeService.currentTheme(this.currentUser).subscribe((theme) => {
                this.backgroundImage = `url(${theme})`;
            });
            this.languageService.currentLanguage(this.currentUser).subscribe((language) => {
                this.updatedLabelLanguage(language);
            });
            this.friendsService.filterByUsers(this.searchInput, this.currentUser).subscribe((users) => {
                this.usersList = users;
            });
        }
        this.showRequestList();
        this.showFriendList();
    }

    updatedLabelLanguage(language: string): void {
        this.title = TITLE[language];
        this.noFriendsReq = NOFRIENDSREQ[language];
        this.noFriends = NOFRIENDS[language];
        this.yourFriends = YOURFRIENDS[language];
        this.friendsLabel = FRIENDSECTION[language];
        this.searchLabel = SEARCHSECTION[language];
        this.requestLabel = REQUESTSSECTION[language];
        this.searchbarLabel = SEARCHBAR[language];
    }

    searchFriend(): void {
        if (this.currentUser) {
            this.friendsService.filterByUsers(this.searchInput, this.currentUser).subscribe((users) => {
                this.usersList = users;
            });
        }
    }

    clickedSendRequest(user: User): void {
        if (this.currentUser) {
            this.friendsService.requestFriend(user, this.currentUser);
        }
    }

    showRequestList(): void {
        if (this.currentUser) {
            this.friendsService.requestsList(this.currentUser).subscribe((request) => {
                this.requestsList = request;
            });
        }
    }

    showFriendList(): void {
        if (this.currentUser) {
            this.friendsService.friendsList(this.currentUser).subscribe((friend) => {
                this.friendsList = friend;
            });
        }
    }

    clickedAcceptRequest(friend: UserInfo): void {
        if (this.currentUser) {
            this.friendsService.acceptRequest(friend, this.currentUser);
        }
    }

    clickedrefuseRequest(friend: UserInfo): void {
        if (this.currentUser) {
            this.friendsService.refuseRequest(friend, this.currentUser);
        }
    }

    clickedDeleteFriend(friend: UserInfo): void {
        if (this.currentUser) {
            this.friendsService.deleteFriend(friend, this.currentUser);
        }
    }

    getRequestStatus(user: User): boolean {
        return user.requests.some((request) => request.uid === this.currentUser?.uid);
    }
}
