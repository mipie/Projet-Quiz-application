import { MatchDataService } from '@app/services/match-data/match-data.service';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

describe('GameDataService', () => {
    let service: MatchDataService;
    const mockModel = {
        countDocuments: jest.fn(),
        insertMany: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
        deleteOne: jest.fn(),
        deleteMany: jest.fn(),
    };
    const logger = {
        log: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MatchDataService,
                {
                    provide: getModelToken('MatchData'),
                    useValue: mockModel,
                },
                {
                    provide: Logger,
                    useValue: logger,
                },
            ],
        }).compile();

        service = module.get<MatchDataService>(MatchDataService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('start', () => {
        it('should populate DB if no documents are present', async () => {
            mockModel.countDocuments.mockResolvedValue(0);
            await service.start();
            expect(mockModel.insertMany).toHaveBeenCalled();
        });
    });

    describe('getAllMatches', () => {
        it('should return all matches', async () => {
            const games = [{}];
            mockModel.find.mockResolvedValue(games);
            expect(await service.getAllMatches()).toEqual(games);
        });
    });

    describe('addMatch', () => {
        const match = {
            title: 'MatchTest',
            startDate: '2023-12-03 16:04:00',
            numberPlayers: 5,
            bestScore: 150,
        };

        it('should add a match', async () => {
            await service.addMatch(match);
            expect(mockModel.create).toHaveBeenCalledWith(match);
        });

        it('should reject with an error if adding fails', async () => {
            const error = new Error('error');
            mockModel.create.mockRejectedValue(error);
            await expect(service.addMatch(match)).rejects.toEqual('Failed to insert match: Error: error');
        });
    });

    describe('deleteAllMatches', () => {
        it('should delete all matches', async () => {
            mockModel.deleteMany.mockResolvedValue({ deletedCount: 1 });
            await service.deleteAllMatches();
            expect(mockModel.deleteMany).toHaveBeenCalledWith({});
        });

        it('should reject with an error if deleting fails', async () => {
            const error = new Error('error');
            mockModel.deleteMany.mockRejectedValue(error);
            await expect(service.deleteAllMatches()).rejects.toEqual('Failed to delete matches: Error: error');
        });

        it('should reject with an error if no game is deleted', async () => {
            mockModel.deleteMany.mockResolvedValue({ deletedCount: 0 });
            await expect(service.deleteAllMatches()).rejects.toEqual('Could not find matches to delete');
        });
    });
});
