/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TO_CHAT, TO_HOME, TO_REGISTER, WEB_TITLE } from '@app/constants';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
    @ViewChild('input') input: ElementRef;
    title = WEB_TITLE;
    usernameInput: string = '';
    passwordInput: string = '';
    isPasswordVisible: boolean = false;
    currentUser: User | null;
    private router: Router = inject(Router);
    private authentificationService: AuthService = inject(AuthService);

    get messageError(): string {
        return this.authentificationService.messageError;
    }

    async ngOnInit(): Promise<void> {
        const isChatWindow = await (window as any).electron.isChatWindow();
        if (isChatWindow) {
            this.router.navigateByUrl(TO_CHAT);
        } else {
            this.currentUser = await this.authentificationService.checkAuthState(TO_HOME);
            this.authentificationService.messageError = '';
        }
    }

    buttonLogin(): void {
        this.authentificationService.login(this.usernameInput, this.passwordInput);
    }

    redirectToRegister(): void {
        this.router.navigate([TO_REGISTER]);
    }

    setVisibility(): void {
        this.isPasswordVisible = !this.isPasswordVisible;
    }
}
