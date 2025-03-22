import { Game } from '@app/model/database/game';
import { GameData } from '@app/model/database/game-data';
import { CreateGameData } from '@app/model/dto/game-data/create-game-data.dto';
import { UpdateGameDataDto } from '@app/model/dto/update/update-game-data.dto';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('GameData')
@Controller('game-data')
export class GameDataController {
    constructor(private readonly gamesDataService: GameDataService) {}

    @ApiOkResponse({
        description: 'Returns all games',
        type: GameData,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/')
    async allGames(@Res() response: Response) {
        try {
            const allCourses = await this.gamesDataService.getAllGames();
            response.status(HttpStatus.OK).json(allCourses);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Get game by id',
        type: Game,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/:id')
    async findGame(@Param('id') id: number, @Res() response: Response) {
        try {
            const game = await this.gamesDataService.getGame(id);
            response.status(HttpStatus.OK).json(game);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiCreatedResponse({
        description: 'Add new game',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Post('/')
    async addGame(@Body() gameDataDto: CreateGameData, @Res() response: Response) {
        try {
            await this.gamesDataService.addGame(gameDataDto);
            response.status(HttpStatus.CREATED).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Modify a game',
        type: Game,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Patch('/')
    async modifyGame(@Body() gameDataDto: UpdateGameDataDto, @Res() response: Response) {
        try {
            await this.gamesDataService.modifyGame(gameDataDto);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Delete a game',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Delete('/:id')
    async deleteCourse(@Param('id') id: number, @Res() response: Response) {
        try {
            await this.gamesDataService.deleteGame(id);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }
}
