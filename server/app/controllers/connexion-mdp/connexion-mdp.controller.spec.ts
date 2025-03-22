import { ConnexionMdpService } from '@app/services/connexion-mdp/connexion-mdp.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { ConnexionMdpController } from './connexion-mdp.controller';
describe('ConnexionMdpController', () => {
    let controller: ConnexionMdpController;
    let service: ConnexionMdpService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ConnexionMdpController],
            providers: [ConnexionMdpService],
        }).compile();

        service = module.get<ConnexionMdpService>(ConnexionMdpService);
        controller = module.get<ConnexionMdpController>(ConnexionMdpController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return true when a valid password is provided', async () => {
        const password = 'validPassword';
        const result = true;
        jest.spyOn(service, 'validateAcceptedPassword').mockResolvedValue(result);
        const responseMock = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        } as unknown as Response;
        await controller.mdpValidator(password, responseMock);
        expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(responseMock.send).toHaveBeenCalledWith(result);
        expect(service.validateAcceptedPassword).toHaveBeenCalledWith(password);
    });

    it('should return false when a valid password is incorrect', async () => {
        const password = 'invalidPassword';
        const errorMessage = 'Password not accepted';
        const result = new Error(errorMessage);
        jest.spyOn(service, 'validateAcceptedPassword').mockRejectedValue(result);
        const responseMock = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        } as unknown as Response;
        await controller.mdpValidator(password, responseMock);
        expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
        expect(responseMock.send).toHaveBeenCalledWith(errorMessage);
        expect(service.validateAcceptedPassword).toHaveBeenCalledWith(password);
    });
});
