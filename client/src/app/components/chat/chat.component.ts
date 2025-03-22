/* eslint-disable deprecation/deprecation */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild, inject } from '@angular/core';
import { MAX_TEXT_COUNT, TO_HOME } from '@app/constants';
import { AuthService } from '@app/services/authentification/auth.service';
import { AvatarService } from '@app/services/avatars/avatar.service';
import { ChannelsService } from '@app/services/channels/channels.service';
import { GameChannelsService } from '@app/services/channels/game-channels.service';
import { LangueService } from '@app/services/langues/langue.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { SoundService } from '@app/services/sound/sound.service';
import { UsernameService } from '@app/services/username/username.service';
import {
    ABANDON,
    CHANNELPLACEHOLDER,
    CHANNELSCREATED,
    CREATE,
    CREATECHANNEL,
    ENTERMESSAGE,
    GENERALCHANNEL,
    HOTEDELETECHANNEL,
    ISMUTED,
    JOIN,
    JOINEXISTANTCHANNEL,
    QUITCHANNEL,
    SEARCH,
    SEND,
    SUPPRIMERCHANNEL,
    YOURCHANNELS,
} from './constants';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, AfterViewInit {
    @Output() isMinimizedEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() isWindowEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
    @ViewChild('chatCanalAdd') addCanalButton: ElementRef<HTMLImageElement>;
    @ViewChild('scrollbar') scrollbar!: ElementRef<HTMLElement>;
    @ViewChild('inputCreateChannel') inputCreateChannel: ElementRef<HTMLInputElement>;
    path: string = TO_HOME;
    remainingTextCount: number = MAX_TEXT_COUNT;
    messageInput = '';
    unLoadCount: number = 0;
    pollingInterval: any;
    isChoosingCanal: boolean = false;
    isAddingCanal: boolean = false;
    searchJoindableChannelsResults: string[] = [];
    searchJoinedChannelsResults: string[] = [];
    searchCreatdedChannelsResults: string[] = [];
    querrySearchActiveChannels: string = '';
    querrySearchJoindableChannels: string = '';
    channelsToJoin: string[] = [];
    newChannelName: string = '';
    wasChannelCreated: boolean = false;
    creationMessage: string = '';
    deletedChannel: string;
    //
    createChannel: string = '';
    channelPlaceholder: string = '';
    create: string = '';
    joinExistantChannel: string = '';
    search: string = '';
    join: string = '';
    yourChannel: string = '';
    generalChannel: string = '';
    quitExistantChannel: string = '';
    channelCreated: string = '';
    abandon: string = '';
    hoteDeleteChannel: string = '';
    enterMessage: string = '';
    sendMessage: string = '';
    currentUserAvatar: string = '';
    deletedtxt: string = '';
    //
    gameChannelsService: GameChannelsService = inject(GameChannelsService);
    channelsService: ChannelsService = inject(ChannelsService);
    private currentService: CurrentGameService = inject(CurrentGameService);
    private socketService: SocketsService = inject(SocketsService);
    private soundService: SoundService = inject(SoundService);
    private authentificationService: AuthService = inject(AuthService);
    private languageService: LangueService = inject(LangueService);
    private avatarService: AvatarService = inject(AvatarService);
    private usernameService: UsernameService = inject(UsernameService);

    get isGameDone(): boolean {
        return this.currentService.isGameDone;
    }

    async ngOnInit(): Promise<void> {
        this.channelsService.currentUser = await this.authentificationService.getCurrentUser();
        if (!this.channelsService.inGame) {
            if (this.channelsService.currentChannel.startsWith('*************')) {
                this.channelsService.currentChannel = 'KAM? PAF!';
            }
            await this.gameChannelsService.resetGamingChannel(this.channelsService.currentUser);
            this.channelsService.roomCode = '';
        }
        if (this.channelsService.currentUser) {
            this.avatarService.updateAvatar(this.channelsService.currentUser).subscribe((avatar) => {
                this.currentUserAvatar = avatar;
            });
            this.usernameService.username(this.channelsService.currentUser).subscribe((newUsername) => {
                if (this.channelsService.currentUser) {
                    this.channelsService.currentUser.username = newUsername;
                }
            });
            this.languageService.currentLanguage(this.channelsService.currentUser).subscribe((language) => {
                this.updatedLabelLanguage(language);
            });
            this.getChatSettings();
            this.getAllChannels();
            this.showChannel(this.channelsService.currentChannel);
            this.socketService.on('isMute', (isMute: boolean) => {
                this.channelsService.isMute = isMute;
                (window as any).electron.muteChanged(isMute);
            });
        }
    }

    updatedLabelLanguage(language: string): void {
        this.deletedtxt = SUPPRIMERCHANNEL[language];
        this.createChannel = CREATECHANNEL[language];
        this.channelPlaceholder = CHANNELPLACEHOLDER[language];
        this.create = CREATE[language];
        this.joinExistantChannel = JOINEXISTANTCHANNEL[language];
        this.search = SEARCH[language];
        this.join = JOIN[language];
        this.yourChannel = YOURCHANNELS[language];
        this.generalChannel = GENERALCHANNEL[language];
        this.quitExistantChannel = QUITCHANNEL[language];
        this.channelCreated = CHANNELSCREATED[language];
        this.abandon = ABANDON[language];
        this.channelsService.isMuted = ISMUTED[language];
        this.hoteDeleteChannel = HOTEDELETECHANNEL[language];
        this.enterMessage = ENTERMESSAGE[language];
        this.sendMessage = SEND[language];
    }

    getAllChannels() {
        this.channelsService.getAllChannels().subscribe((channels) => {
            if (!this.channelsService.currentUser) return;
            this.channelsService.currentUser.joinedChannels.map((channel) => {
                if (!channels.includes(channel.title)) {
                    this.channelsService.quitChannel(channel.title, this.channelsService.currentUser);
                }
            });
            this.channelsToJoin = [];
            channels.forEach((channelTitle) => {
                if (!this.channelsService.currentUser) return;
                if (
                    !this.channelsService.currentUser.joinedChannels.find((channel) => channel.title === channelTitle) &&
                    !this.channelsService.currentUser.createdChannels.find((channel) => channel.title === channelTitle) &&
                    channelTitle !== 'KAM? PAF!'
                ) {
                    this.channelsToJoin.push(channelTitle);
                }
            });
        });
    }

    ngAfterViewInit() {
        this.scrollbar.nativeElement.addEventListener('wheel', (event) => {
            event.preventDefault();
            this.scrollbar.nativeElement.scrollTop -= event.deltaY;
        });
    }

    valueChange(value: string) {
        this.remainingTextCount = MAX_TEXT_COUNT - value.length;
    }

    searchJoinableChannels(querry: string) {
        if (!querry) this.getAllChannels();
        this.channelsService.searchChannels(querry).subscribe((channels) => {
            this.searchJoindableChannelsResults = [];
            channels.map((channelTitle) => {
                if (!this.channelsService.currentUser) return;
                if (
                    !this.channelsService.currentUser.joinedChannels.find((channel) => channel.title === channelTitle) &&
                    !this.channelsService.currentUser.createdChannels.find((channel) => channel.title === channelTitle) &&
                    channelTitle !== 'KAM? PAF!'
                ) {
                    this.searchJoindableChannelsResults.push(channelTitle);
                }
            });
        });
    }

    searchActiveChannels(querry: string) {
        if (!querry) this.getAllChannels();
        this.channelsService.searchChannels(querry).subscribe((channels) => {
            this.searchJoinedChannelsResults = [];
            this.searchCreatdedChannelsResults = [];
            channels.map((channelTitle) => {
                if (!this.channelsService.currentUser) return;
                if (this.channelsService.currentUser.joinedChannels.find((channel) => channel.title === channelTitle) || channelTitle === 'KAM? PAF!')
                    this.searchJoinedChannelsResults.push(channelTitle);
                if (this.channelsService.currentUser.createdChannels.find((channel) => channel.title === channelTitle))
                    this.searchCreatdedChannelsResults.push(channelTitle);
            });
        });
    }

    trackByIndex(index: number): number {
        return index;
    }

    showChannel(title: string = 'KAM? PAF!', closeTopBar: boolean = false): void {
        if (this.deletedChannel) {
            this.deletedChannel = '';
        }
        if (this.channelsService.messagesSubscription) {
            this.channelsService.messagesSubscription.unsubscribe();
        }
        this.channelsService.currentChannel = title;
        if (!this.channelsService.currentChannel.startsWith('*************')) {
            this.channelsService.messagesSubscription = this.channelsService.getChannel(title).subscribe({
                next: (messages) => {
                    if (!this.channelsService.currentUser) return;
                    this.channelsService.messages = messages;
                    this.channelsService.updateLastSeenMessage(this.channelsService.currentUser, title);
                },
                error: (error) => {
                    if (error instanceof Error) {
                        this.deletedChannel = title;
                    }
                },
            });
        } else {
            this.channelsService.messagesSubscription = this.gameChannelsService.getChannelMessages(title).subscribe({
                next: (messages) => {
                    if (!this.channelsService.currentUser) return;
                    this.channelsService.messages = messages;
                    this.channelsService.updateLastSeenMessage(this.channelsService.currentUser, title);
                },
            });
        }
        if (closeTopBar && this.isAddingCanal) this.onAddingCanal();
        if (closeTopBar && this.isChoosingCanal) this.onChoosingCanal();
        this.setChatSettings(this.channelsService.isMinimized, this.channelsService.isMaximized);
    }

    onSubmit(event: Event): void {
        if (this.messageInput.trim() === '') {
            event.preventDefault();
            return;
        }
        if (this.messageInput.length !== 0 && this.messageInput.trim() && this.channelsService.currentUser != null) {
            if (!this.channelsService.currentChannel.startsWith('*************')) {
                this.channelsService.sendChat(
                    this.channelsService.currentUser?.username,
                    this.messageInput,
                    this.channelsService.currentChannel,
                    this.currentUserAvatar,
                );
            } else {
                this.gameChannelsService.sendChat(
                    this.channelsService.currentUser?.username,
                    this.messageInput,
                    this.channelsService.currentChannel,
                    this.currentUserAvatar,
                );
            }
            this.messageInput = '';
            this.remainingTextCount = 200;
        }
        this.soundService.buttonClick();
        event.preventDefault();
    }

    inputValidation(event: KeyboardEvent, message: string): void {
        if (event.key === 'Enter' && event.shiftKey) {
            event.preventDefault();
            return;
        }
        if (event.key === ' ' && !message.trim()) {
            event.preventDefault();
            return;
        }
    }

    onChoosingCanal(): void {
        this.isChoosingCanal = !this.isChoosingCanal;
        if (this.isAddingCanal && this.isChoosingCanal) {
            this.onAddingCanal();
            this.isAddingCanal = false;
        }
        this.resetValues();
    }

    onAddingCanal(): void {
        this.isAddingCanal = !this.isAddingCanal;
        const icon = this.addCanalButton.nativeElement;
        if (icon?.src.includes('chatAdd.png')) {
            icon.src = './assets/chatMinus.png';
        } else {
            icon.src = './assets/chatAdd.png';
        }
        if (this.isChoosingCanal && this.isAddingCanal) {
            this.isChoosingCanal = false;
        }
        this.resetValues();
    }

    returnToChat() {
        if (this.isAddingCanal) {
            this.onAddingCanal();
            this.isAddingCanal = false;
        }
        if (this.isChoosingCanal) {
            this.isChoosingCanal = false;
        }
        this.resetValues();
    }

    setChatSettings(isMinimized: boolean, isMaximized: boolean) {
        if (this.channelsService.isMinimized || this.channelsService.isMaximized) {
            if (this.isAddingCanal) {
                this.onAddingCanal();
                this.isAddingCanal = false;
            }
            this.isChoosingCanal = false;
        }
        this.channelsService.isMaximized = isMaximized;
        this.channelsService.isMinimized = isMinimized;
        this.isMinimizedEvent.emit(this.channelsService.isMinimized);
        this.isWindowEvent.emit(this.channelsService.isMaximized);
    }

    getChatSettings(): void {
        this.isMinimizedEvent.emit(this.channelsService.isMinimized);
        this.isWindowEvent.emit(this.channelsService.isMaximized);
        this.resetValues();
    }

    startPolling() {
        this.stopPolling();
        (window as any).electron.setCurrentChannel(this.channelsService.currentChannel);
        this.pollingInterval = setInterval(async () => {
            if (await (window as any).electron.isWindowClosed('chatWindow')) {
                this.channelsService.isMaximized = false;
                this.channelsService.isMinimized = false;
                this.channelsService.currentUser = await this.authentificationService.getCurrentUser();
                this.channelsService.currentChannel = await (window as any).electron.getCurrentChannel();
                this.showChannel(this.channelsService.currentChannel);
                this.setChatSettings(this.channelsService.isMinimized, this.channelsService.isMaximized);
                if ((window as any).electron) {
                    (window as any).electron.setSize({ isMinimized: false, isMaximized: false });
                }
                this.stopPolling();
            }
        }, 100);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    async maximize(): Promise<void> {
        this.channelsService.isMaximized = !this.channelsService.isMaximized;
        this.channelsService.isMinimized = this.channelsService.isMaximized;
        this.setChatSettings(this.channelsService.isMinimized, this.channelsService.isMaximized);
        if (!this.channelsService.isMaximized && !(await (window as any).electron.isWindowClosed('chatWindow'))) {
            (window as any).electron.close('chatWindow');
        } else if (this.channelsService.isMaximized) {
            setTimeout(() => {
                (window as any).electron.setCurrentUser(this.channelsService.currentUser);
                (window as any).electron.openChatWindow();
                this.startPolling();
            }, 300);
        }
        this.resetValues();
    }

    minimize(): void {
        if (!this.channelsService.isMaximized) {
            this.channelsService.isMinimized = !this.channelsService.isMinimized;
            this.setChatSettings(this.channelsService.isMinimized, this.channelsService.isMaximized);
        }
        this.resetValues();
    }

    detectInput() {
        this.creationMessage = '';
    }

    resetValues() {
        this.newChannelName = '';
        this.creationMessage = '';
        this.querrySearchActiveChannels = '';
        this.querrySearchJoindableChannels = '';
    }

    async createNewChannel() {
        this.newChannelName = this.newChannelName.trim();
        if (!this.newChannelName) {
            this.creationMessage = "*Un nom vide n'est pas permis.";
            return;
        }
        this.wasChannelCreated = await this.channelsService.createChannel(this.newChannelName, this.channelsService.currentUser);
        if (this.wasChannelCreated) {
            this.creationMessage = '*Votre Canal à bien été créer.';
            this.showChannel(this.newChannelName);
            setTimeout(() => {
                this.newChannelName = '';
                this.creationMessage = '';
                this.wasChannelCreated = false;
            }, 1000);
        } else {
            this.creationMessage = '*Ce nom est déjà utilisé.';
        }
    }

    joinChannel(title: string, event: MouseEvent) {
        event.stopPropagation();
        if (!this.channelsService.currentUser) return;
        this.channelsService.joinChannel(title, this.channelsService.currentUser);
        this.channelsToJoin = this.channelsToJoin.filter((channel) => title !== channel);
        this.channelsService.sendChat(
            this.channelsService.currentUser?.username,
            `${this.channelsService.currentUser?.username} a rejoint le canal.`,
            title,
            this.currentUserAvatar,
            true,
        );
    }

    quitChannel(title: string, event?: MouseEvent) {
        event?.stopPropagation();
        if (!this.channelsService.currentUser) return;
        this.channelsService.quitChannel(title, this.channelsService.currentUser);
        this.channelsService.sendChat(
            this.channelsService.currentUser?.username,
            `${this.channelsService.currentUser?.username} a quitté le canal.`,
            title,
            this.currentUserAvatar,
            true,
        );
        if (this.channelsService.currentChannel === title) this.showChannel();
        if (!this.channelsService.wasChannelDeleted(title)) {
            this.channelsToJoin.push(title);
        }
    }

    deleteChannel(title: string, event: MouseEvent) {
        event.stopPropagation();
        this.channelsService.deleteChannel(title, this.channelsService.currentUser);
        if (this.channelsService.currentChannel === title) this.showChannel();
    }
}
