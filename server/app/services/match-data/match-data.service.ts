import { MatchData, MatchDataDocument } from '@app/model/database/match-data';
import { CreateMatchData } from '@app/model/dto/match-data/create-match-data.dto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class MatchDataService {
    constructor(
        @InjectModel(MatchData.name) public matchDataModel: Model<MatchDataDocument>,
        private readonly logger: Logger,
    ) {
        this.start();
    }

    async start() {
        if ((await this.matchDataModel.countDocuments()) === 0) await this.populateDB();
    }

    async populateDB(): Promise<void> {
        const matches: CreateMatchData[] = [
            {
                title: 'Jeu de Culture Générale',
                startDate: '2023-11-16T14:18:04+00:00',
                numberPlayers: 10,
                bestScore: 1000,
            },
            {
                title: 'Jeu avec une twist',
                startDate: '2023-10-01T14:18:04+00:00',
                numberPlayers: 10,
                bestScore: 300,
            },
            {
                title: 'Star Wars Lego',
                startDate: '2001-06-15T16:00:00+00:00',
                numberPlayers: 500,
                bestScore: 150,
            },
        ];
        this.logger.log('THIS ADDS DATA TO THE DATABASE, DO NOT USE OTHERWISE');
        await this.matchDataModel.insertMany(matches);
    }

    async getAllMatches(): Promise<MatchData[]> {
        return await this.matchDataModel.find({});
    }

    async addMatch(match: CreateMatchData): Promise<void> {
        try {
            await this.matchDataModel.create(match);
        } catch (error) {
            return Promise.reject(`Failed to insert match: ${error}`);
        }
    }

    async deleteAllMatches(): Promise<void> {
        try {
            const res = await this.matchDataModel.deleteMany({});
            if (res.deletedCount === 0) return Promise.reject('Could not find matches to delete');
        } catch (error) {
            return Promise.reject(`Failed to delete matches: ${error}`);
        }
    }
}
