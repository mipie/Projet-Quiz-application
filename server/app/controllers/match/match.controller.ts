import { MatchData } from '@app/model/database/match-data';
import { CreateMatchData } from '@app/model/dto/match-data/create-match-data.dto';
import { MatchDataService } from '@app/services/match-data/match-data.service';
import { Body, Controller, Delete, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('MatchData')
@Controller('match-data')
export class MatchDataController {
    constructor(private readonly matchDataService: MatchDataService) {}

    @ApiOkResponse({
        description: 'Returns all matches',
        type: MatchData,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/')
    async allMatches(@Res() response: Response) {
        try {
            const allCourses = await this.matchDataService.getAllMatches();
            response.status(HttpStatus.OK).json(allCourses);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiCreatedResponse({
        description: 'Add new match',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Post('/')
    async addMatch(@Body() matchDataDto: CreateMatchData, @Res() response: Response) {
        try {
            await this.matchDataService.addMatch(matchDataDto);
            response.status(HttpStatus.CREATED).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Delete all matches',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Delete('/')
    async deleteAllMatches(@Res() response: Response) {
        try {
            await this.matchDataService.deleteAllMatches();
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }
}
