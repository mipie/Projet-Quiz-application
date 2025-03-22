import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TO_ADMIN, TO_CREATE_GAME, TO_LOGIN, TO_MODIFY_GAME } from '@app/constants';
import { AuthService } from '@app/services/authentification/auth.service';

export const authConnexionGuard = (): boolean => {
    const router = inject(Router);
    const authServices = inject(AuthService);
    const previousUrl = router.routerState.snapshot.url.substring(1);
    const url = [TO_CREATE_GAME, TO_MODIFY_GAME, TO_ADMIN].includes(previousUrl);
    if (authServices.isConnected || url) return true;
    router.navigate([TO_LOGIN]);
    return false;
};
