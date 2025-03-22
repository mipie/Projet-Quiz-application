import { Component, Input, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MAX_TEXT_COUNT } from '@app/constants';
import { Message } from '@app/interfaces/message/message';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { ChatService } from '@app/services/room-game/chat.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { SoundService } from '@app/services/sound/sound.service';

@Component({
    selector: 'app-message',
    templateUrl: './message.component.html',
    styleUrls: ['./message.component.scss'],
})
export class MessageComponent implements OnInit {
    @Input() isOrganisator: boolean = false;
    messages: Message[] = [];
    remainingTextCount: number = MAX_TEXT_COUNT;
    messageInput = '';
    isMute: boolean = false;
    isOnResult: boolean = false;
    private currentService: CurrentGameService = inject(CurrentGameService);
    private dialog: DialogsService = inject(DialogsService);
    private chatService: ChatService = inject(ChatService);
    private socketService: SocketsService = inject(SocketsService);
    private soundService: SoundService = inject(SoundService);
    private router: Router = inject(Router);

    get isGameDone(): boolean {
        return this.currentService.isGameDone;
    }

    ngOnInit(): void {
        this.getMessage();
        this.socketService.on('isMute', (isMute: boolean) => {
            this.isMute = isMute;
        });
    }

    onSubmit() {
        if (this.messageInput.trim() !== '') this.chatService.sendMessage(this.messageInput);
        this.messageInput = '';
    }

    valueChange(value: string) {
        this.remainingTextCount = MAX_TEXT_COUNT - value.length;
    }

    buttonClick() {
        this.soundService.buttonClick();
    }

    async openAbandonDialog(): Promise<void> {
        if (await this.dialog.openGiveUp()) {
            this.socketService.send('giveUp');
            this.router.navigate(['home']);
            this.socketService.disconnect();
        }
    }

    async quitGame(): Promise<void> {
        if (await this.dialog.openGiveUp()) this.socketService.send('quitGame');
    }

    private getMessage() {
        this.messages = this.chatService.allChats;
    }
}
