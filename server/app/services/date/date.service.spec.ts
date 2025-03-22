import { Test, TestingModule } from '@nestjs/testing';
import { DateService } from './date.service';

describe('DateService', () => {
    let service: DateService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DateService],
        }).compile();

        service = module.get<DateService>(DateService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return the current time', () => {
        const index = -2;
        const hours = '00' + new Date().getHours().toString();
        const minutes = '00' + new Date().getMinutes().toString();
        const seconds = '00' + new Date().getSeconds().toString();
        const expectedMock = `${hours.slice(index)}:${minutes.slice(index)}:${seconds.slice(index)}`;
        expect(service.currentTime()).toEqual(expectedMock);
    });
});
