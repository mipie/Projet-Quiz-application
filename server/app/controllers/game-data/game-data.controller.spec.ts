import { GameDataController } from '@app/controllers/game-data/game-data.controller';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';

describe('GameDataController', () => {
    let controller: GameDataController;
    let service: GameDataService;
    let mockResponse: Partial<Response>;

    beforeEach(async () => {
        service = {
            getAllGames: jest.fn(),
            getGame: jest.fn(),
            addGame: jest.fn(),
            modifyGame: jest.fn(),
            deleteGame: jest.fn(),
        } as never;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [GameDataController],
            providers: [{ provide: GameDataService, useValue: service }],
        }).compile();

        controller = module.get<GameDataController>(GameDataController);

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('allGames', () => {
        it('should return all games with HttpStatus.OK', async () => {
            const mockGames = [{}];
            (service.getAllGames as jest.Mock).mockResolvedValue(mockGames);

            await controller.allGames(mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith(mockGames);
        });

        it('should handle error and return HttpStatus.NOT_FOUND', async () => {
            (service.getAllGames as jest.Mock).mockRejectedValue(new Error('Error message'));

            await controller.allGames(mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
            expect(mockResponse.send).toHaveBeenCalledWith('Error message');
        });
    });

    describe('findGame', () => {
        it('should return game with HttpStatus.OK', async () => {
            const mockGame = {};
            const gameId = 1;
            (service.getGame as jest.Mock).mockResolvedValue(mockGame);

            await controller.findGame(gameId, mockResponse as Response);

            expect(service.getGame).toHaveBeenCalledWith(gameId);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith(mockGame);
        });

        it('should handle error and return HttpStatus.NOT_FOUND', async () => {
            const gameId = 1;
            (service.getGame as jest.Mock).mockRejectedValue(new Error('Error message'));

            await controller.findGame(gameId, mockResponse as Response);

            expect(service.getGame).toHaveBeenCalledWith(gameId);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
            expect(mockResponse.send).toHaveBeenCalledWith('Error message');
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

        it('should add game and return HttpStatus.CREATED', async () => {
            await controller.addGame(game, mockResponse as Response);

            expect(service.addGame).toHaveBeenCalledWith(game);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        it('should handle error and return HttpStatus.NOT_FOUND', async () => {
            (service.addGame as jest.Mock).mockRejectedValue(new Error('Error message'));

            await controller.addGame(game, mockResponse as Response);

            expect(service.addGame).toHaveBeenCalledWith(game);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
            expect(mockResponse.send).toHaveBeenCalledWith('Error message');
        });
    });

    describe('modifyGame', () => {
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
                        type: 'QCM',
                        text: 'Parmi les mots suivants, lesquels sont des mots clés réservés en JS?',
                        points: 50,
                        choices: [
                            {
                                text: 'var',
                                isCorrect: true,
                            },
                            {
                                text: 'self',
                                isCorrect: false,
                            },
                        ],
                    },
                ],
            },
        };
        it('should modify game and return HttpStatus.OK', async () => {
            await controller.modifyGame(game, mockResponse as Response);

            expect(service.modifyGame).toHaveBeenCalledWith(game);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        it('should handle error and return HttpStatus.NOT_FOUND', async () => {
            (service.modifyGame as jest.Mock).mockRejectedValue(new Error('Error message'));

            await controller.modifyGame(game, mockResponse as Response);

            expect(service.modifyGame).toHaveBeenCalledWith(game);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
            expect(mockResponse.send).toHaveBeenCalledWith('Error message');
        });
    });

    describe('deleteCourse', () => {
        it('should delete game and return HttpStatus.OK', async () => {
            const gameId = 1;
            await controller.deleteCourse(gameId, mockResponse as Response);

            expect(service.deleteGame).toHaveBeenCalledWith(gameId);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        it('should handle error and return HttpStatus.NOT_FOUND', async () => {
            const gameId = 1;
            (service.deleteGame as jest.Mock).mockRejectedValue(new Error('Error message'));

            await controller.deleteCourse(gameId, mockResponse as Response);

            expect(service.deleteGame).toHaveBeenCalledWith(gameId);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
            expect(mockResponse.send).toHaveBeenCalledWith('Error message');
        });
    });
});
