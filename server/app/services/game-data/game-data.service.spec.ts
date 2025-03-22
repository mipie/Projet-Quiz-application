import { GameDataService } from '@app/services/game-data/game-data.service';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

describe('GameDataService', () => {
    let service: GameDataService;
    const mockModel = {
        countDocuments: jest.fn(),
        insertMany: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        updateOne: jest.fn(),
        deleteOne: jest.fn(),
    };
    const logger = {
        log: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameDataService,
                {
                    provide: getModelToken('GameData'),
                    useValue: mockModel,
                },
                {
                    provide: Logger,
                    useValue: logger,
                },
            ],
        }).compile();

        service = module.get<GameDataService>(GameDataService);
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

    describe('getAllGames', () => {
        it('should return all games', async () => {
            const games = [{}];
            mockModel.find.mockResolvedValue(games);
            expect(await service.getAllGames()).toEqual(games);
        });
    });

    describe('getGame', () => {
        it('should return the game with the given id', async () => {
            const gameId = 1;
            const game = { id: gameId };
            mockModel.findOne.mockResolvedValue(game);
            expect(await service.getGame(gameId)).toEqual(game);
        });
    });

    describe('addGame', () => {
        const game = {
            id: 0,
            isVisible: true,
            isChecked: false,
            game: {
                $schema: 'jeuTest.json',
                title: 'Jeu Test',
                description: "C'est un jeu pour tester si le site marche.",
                duration: 60,
                lastModification: '2023-09-11T20:20:39+00:00',
                questions: [
                    {
                        id: 0,
                        type: 'QCM',
                        text: 'Parmi les mots suivants, lesquels sont des mots clés réservés en JS?',
                        points: 50,
                        choices: [
                            {
                                id: 0,
                                text: 'var',
                                isCorrect: true,
                            },
                            {
                                id: 1,
                                text: 'self',
                                isCorrect: false,
                            },
                        ],
                    },
                ],
            },
        };

        it('should add a game', async () => {
            await service.addGame(game);
            expect(mockModel.create).toHaveBeenCalledWith(game);
        });

        it('should reject with an error if adding fails', async () => {
            const error = new Error('error');
            mockModel.create.mockRejectedValue(error);
            await expect(service.addGame(game)).rejects.toEqual('Failed to insert game: Error: error');
        });
    });

    describe('modifyGame', () => {
        it('should modify a game', async () => {
            const game = { id: 1 };
            mockModel.updateOne.mockResolvedValue({ matchedCount: 1 });
            await service.modifyGame(game);
            expect(mockModel.updateOne).toHaveBeenCalledWith({ id: game.id }, game);
        });

        it('should reject with an error if modifying fails', async () => {
            const error = new Error('error');
            mockModel.updateOne.mockRejectedValue(error);
            await expect(service.modifyGame({ id: 1 })).rejects.toEqual('Failed to update document: Error: error');
        });

        it('should reject with an error if no game is matched', async () => {
            mockModel.updateOne.mockResolvedValue({ matchedCount: 0 });
            await expect(service.modifyGame({ id: 1 })).rejects.toEqual('Could not find course');
        });
    });

    describe('deleteGame', () => {
        it('should delete a game', async () => {
            const gameId = 1;
            mockModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
            await service.deleteGame(gameId);
            expect(mockModel.deleteOne).toHaveBeenCalledWith({ id: gameId });
        });

        it('should reject with an error if deleting fails', async () => {
            const error = new Error('error');
            mockModel.deleteOne.mockRejectedValue(error);
            await expect(service.deleteGame(1)).rejects.toEqual('Failed to delete game: Error: error');
        });

        it('should reject with an error if no game is deleted', async () => {
            mockModel.deleteOne.mockResolvedValue({ deletedCount: 0 });
            await expect(service.deleteGame(1)).rejects.toEqual('Could not find game');
        });
    });
});
