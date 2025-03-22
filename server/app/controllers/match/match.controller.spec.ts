import { MatchDataController } from '@app/controllers/match/match.controller';
import { MatchDataService } from '@app/services/match-data/match-data.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';

describe('GameDataController', () => {
    let controller: MatchDataController;
    let service: MatchDataService;
    let mockResponse: Partial<Response>;

    beforeEach(async () => {
        service = {
            getAllMatches: jest.fn(),
            addMatch: jest.fn(),
            deleteAllMatches: jest.fn(),
            deleteMany: jest.fn(),
        } as never;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [MatchDataController],
            providers: [{ provide: MatchDataService, useValue: service }],
        }).compile();

        controller = module.get<MatchDataController>(MatchDataController);

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('allMatches', () => {
        it('should return all matches with HttpStatus.OK', async () => {
            const mockMatches = [{}];
            (service.getAllMatches as jest.Mock).mockResolvedValue(mockMatches);

            await controller.allMatches(mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith(mockMatches);
        });

        it('should handle error and return HttpStatus.NOT_FOUND', async () => {
            (service.getAllMatches as jest.Mock).mockRejectedValue(new Error('Error message'));

            await controller.allMatches(mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
            expect(mockResponse.send).toHaveBeenCalledWith('Error message');
        });
    });

    describe('addMatch', () => {
        const match = {
            title: 'MatchTest',
            startDate: '2023-12-03 16:40:00',
            numberPlayers: 5,
            bestScore: 150,
        };

        it('should add match and return HttpStatus.CREATED', async () => {
            await controller.addMatch(match, mockResponse as Response);

            expect(service.addMatch).toHaveBeenCalledWith(match);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        it('should handle error and return HttpStatus.NOT_FOUND', async () => {
            (service.addMatch as jest.Mock).mockRejectedValue(new Error('Error message'));

            await controller.addMatch(match, mockResponse as Response);

            expect(service.addMatch).toHaveBeenCalledWith(match);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
            expect(mockResponse.send).toHaveBeenCalledWith('Error message');
        });
    });

    describe('deleteAllMatches', () => {
        it('should delete matches and return HttpStatus.OK', async () => {
            await controller.deleteAllMatches(mockResponse as Response);

            expect(service.deleteAllMatches).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        it('should handle error and return HttpStatus.NOT_FOUND', async () => {
            (service.deleteAllMatches as jest.Mock).mockRejectedValue(new Error('Error message'));

            await controller.deleteAllMatches(mockResponse as Response);

            expect(service.deleteAllMatches).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
            expect(mockResponse.send).toHaveBeenCalledWith('Error message');
        });
    });
});
