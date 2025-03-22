import { Injectable } from '@nestjs/common';

@Injectable()
export class DateService {
    currentTime(): string {
        const index = -2;
        const hours = '00' + new Date().getHours().toString();
        const minutes = '00' + new Date().getMinutes().toString();
        const seconds = '00' + new Date().getSeconds().toString();
        return `${hours.slice(index)}:${minutes.slice(index)}:${seconds.slice(index)}`;
    }
}
