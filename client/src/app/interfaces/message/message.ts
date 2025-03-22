export class Message {
    author: string;
    sentTime: string;
    chatMessage: string;

    constructor(message?: Message) {
        if (message) {
            this.author = message.author;
            this.sentTime = message.sentTime;
            this.chatMessage = message.chatMessage;
        } else {
            this.author = '';
            this.sentTime = '';
            this.chatMessage = '';
        }
    }
}
