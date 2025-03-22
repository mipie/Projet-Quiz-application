import { GameData, GameDataDocument } from '@app/model/database/game-data';
import { CreateGameData } from '@app/model/dto/game-data/create-game-data.dto';
import { UpdateGameDataDto } from '@app/model/dto/update/update-game-data.dto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class GameDataService {
    constructor(
        @InjectModel(GameData.name) public gameDataModel: Model<GameDataDocument>,
        private readonly logger: Logger,
    ) {
        this.start();
    }

    async start() {
        if ((await this.gameDataModel.countDocuments()) === 0) {
            await this.populateDB();
        }
    }

    async populateDB(): Promise<void> {
        const games: CreateGameData[] = [
            {
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
                                {
                                    text: 'this',
                                    isCorrect: true,
                                },
                                {
                                    text: 'int',
                                    isCorrect: false,
                                },
                            ],
                            qre: {
                                lowerBound: 0,
                                goodAnswer: 20,
                                margin: 5,
                                upperBound: 100,
                            },
                            imageURL: [],
                        },
                    ],
                },
            },
        ];
        this.logger.log('THIS ADDS DATA TO THE DATABASE, DO NOT USE OTHERWISE');
        await this.gameDataModel.insertMany(games);
    }

    async getAllGames(): Promise<GameData[]> {
        return await this.gameDataModel.find({});
    }

    async getGame(gameId: number): Promise<GameData> {
        return await this.gameDataModel.findOne({ id: gameId });
    }

    async addGame(game: CreateGameData): Promise<void> {
        try {
            await this.gameDataModel.create(game);
            this.logger.log(game);
        } catch (error) {
            this.logger.log(error.message);
            return Promise.reject(`Failed to insert game: ${error}`);
        }
    }

    async modifyGame(game: UpdateGameDataDto): Promise<void> {
        const filterQuery = { id: game.id };
        try {
            const res = await this.gameDataModel.updateOne(filterQuery, game);
            this.logger.log(game);
            if (res.matchedCount === 0) return Promise.reject('Could not find course');
        } catch (error) {
            this.logger.log(error.message);
            return Promise.reject(`Failed to update document: ${error}`);
        }
    }

    async deleteGame(gameId: number): Promise<void> {
        try {
            const res = await this.gameDataModel.deleteOne({ id: gameId });
            if (res.deletedCount === 0) return Promise.reject('Could not find game');
        } catch (error) {
            return Promise.reject(`Failed to delete game: ${error}`);
        }
    }
}
