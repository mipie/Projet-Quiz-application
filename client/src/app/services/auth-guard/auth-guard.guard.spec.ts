import { TestBed, fakeAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authConnexionGuard } from './auth-guard.guard';
import { HttpClientModule } from '@angular/common/http';
import { TO_ADMIN, TO_CREATE_GAME, TO_LOGIN, TO_MODIFY_GAME } from '@app/constants';
import { AuthService } from './auth-service.service';

describe('AuthConnexionGuard', () => {
    let authService: AuthService;
    const routerMock = {
        navigate: jasmine.createSpy('navigate'),
        routerState: {
            snapshot: {
                url: '/previousUrl',
            },
        },
    };
    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [{ provide: Router, useValue: routerMock }],
        });
        authService = TestBed.inject(AuthService);
    });

    it('authConnextion guard should return true', fakeAsync(() => {
        authService.isPasswordCorrect = true;

        const ret = TestBed.runInInjectionContext(authConnexionGuard);

        expect(ret).toBeTrue();
    }));

    it('authConnextion guard should return true if we create a game', fakeAsync(() => {
        authService.isPasswordCorrect = true;
        routerMock.routerState.snapshot.url = 'createGame';

        const ret = TestBed.runInInjectionContext(authConnexionGuard);
        expect(ret).toBeTrue();
        expect(routerMock.routerState.snapshot.url).toEqual(TO_CREATE_GAME);
    }));

    it('authConnextion guard should return true if we modify a game', fakeAsync(() => {
        authService.isPasswordCorrect = true;
        routerMock.routerState.snapshot.url = 'modifyGame';

        const ret = TestBed.runInInjectionContext(authConnexionGuard);
        expect(ret).toBeTrue();
        expect(routerMock.routerState.snapshot.url).toEqual(TO_MODIFY_GAME);
    }));

    it('authConnextion guard should return true if we modify a game', fakeAsync(() => {
        authService.isPasswordCorrect = true;
        routerMock.routerState.snapshot.url = 'admin';

        const ret = TestBed.runInInjectionContext(authConnexionGuard);
        expect(ret).toBeTrue();
        expect(routerMock.routerState.snapshot.url).toEqual(TO_ADMIN);
    }));

    it('authConnextion guard should return false', fakeAsync(() => {
        authService.isPasswordCorrect = false;

        const ret = TestBed.runInInjectionContext(authConnexionGuard);

        expect(ret).toBe(false);
        expect(routerMock.navigate).toHaveBeenCalledWith([TO_LOGIN]);
    }));
});
