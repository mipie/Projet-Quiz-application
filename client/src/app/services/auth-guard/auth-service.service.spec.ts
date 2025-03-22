import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth-service.service';

describe('AuthServiceService', () => {
    let service: AuthService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AuthService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set isPasswordCorrect', () => {
        service.isPasswordCorrect = true;
        expect(service.isPasswordCorrect).toBeTrue();
    });

    it('should get isPasswordCorrect', () => {
        const isItReally = service.isPasswordCorrect;
        expect(isItReally).toBeFalse();
    });
});
