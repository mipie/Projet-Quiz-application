import { Test, TestingModule } from '@nestjs/testing';
import { ConnexionMdpService } from './connexion-mdp.service';

describe('ConnexionMdpService', () => {
    let service: ConnexionMdpService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ConnexionMdpService],
        }).compile();

        service = module.get<ConnexionMdpService>(ConnexionMdpService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should verify if the password is correct when validateAcceptedPassword() is called', async () => {
        const passwordValid = 'Anis';
        const isValid = await service.validateAcceptedPassword(passwordValid);
        expect(isValid).toBe(true);
    });
});
