import { Message } from '@app/interfaces/message/message';

describe('Interface: Message', () => {
    let service: Message;

    it('should be created an filled by default', () => {
        service = new Message();
        expect(service).toBeTruthy();
        expect(service.author).toEqual('');
        expect(service.sentTime).toEqual('');
        expect(service.chatMessage).toEqual('');
    });

    it('should be created from another message', () => {
        const message = new Message({
            author: 'John',
            sentTime: '22:22:22',
            chatMessage: 'Hello, my name is John',
        });
        service = new Message(message);
        expect(service).toEqual(message);
    });
});
