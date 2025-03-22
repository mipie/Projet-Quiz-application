import { ConnexionMdpService } from '@app/services/connexion-mdp/connexion-mdp.service';
import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger';
import { Response } from 'express';

@Controller('connexion-mdp')
export class ConnexionMdpController {
    constructor(private readonly connexionMdpService: ConnexionMdpService) {}

    @ApiOkResponse({
        description: 'Return a boolean when the password is correct',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Post('password')
    async mdpValidator(@Body('password') password: string, @Res() response: Response) {
        try {
            const isValid = await this.connexionMdpService.validateAcceptedPassword(password);
            response.status(HttpStatus.OK).send(isValid);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }
}
