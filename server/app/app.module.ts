import { RoomGateway } from '@app/gateways/room/room.gateway';
import { GameData, gameDataSchema } from '@app/model/database/game-data';
import { DateService } from '@app/services/date/date.service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ConnexionMdpController } from './controllers/connexion-mdp/connexion-mdp.controller';
import { GameDataController } from './controllers/game-data/game-data.controller';
import { MatchDataController } from './controllers/match/match.controller';
import { TimerGateway } from './gateways/timer/timer.gateway';
import { MatchData, matchDataSchema } from './model/database/match-data';
import { ConnexionMdpService } from './services/connexion-mdp/connexion-mdp.service';
import { GameDataService } from './services/game-data/game-data.service';
import { MatchDataService } from './services/match-data/match-data.service';
import { PlayerListService } from './services/player-list/player-list.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'), // Loaded from .env
            }),
        }),
        MongooseModule.forFeature([
            { name: GameData.name, schema: gameDataSchema },
            { name: MatchData.name, schema: matchDataSchema },
        ]),
    ],
    controllers: [GameDataController, ConnexionMdpController, MatchDataController],
    providers: [RoomGateway, DateService, Logger, GameDataService, MatchDataService, ConnexionMdpService, PlayerListService, TimerGateway],
})
export class AppModule {}
