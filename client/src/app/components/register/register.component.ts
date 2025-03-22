import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TO_LOGIN, WEB_TITLE } from '@app/constants';
import { AuthService } from '@app/services/authentification/auth.service';
import { AvatarService } from '@app/services/avatars/avatar.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
    @ViewChild('input') input: ElementRef;
    title = WEB_TITLE;
    usernameInput: string = '';
    emailInput: string = '';
    passwordInput: string = '';
    isPasswordVisible: boolean = false;
    selectedAvatar: string = '';
    private router: Router = inject(Router);
    private authentification: AuthService = inject(AuthService);
    private avatarService: AvatarService = inject(AvatarService);

    get messageErrorRegister(): string {
        return this.authentification.messageErrorRegister;
    }

    get avatarUrls(): string[] {
        return this.avatarService.avatarUrls;
    }

    ngOnInit(): void {
        this.avatarService.loadAvatarsCreation();
        this.authentification.setMessageErrorRegister = '';
    }

    onAvatarClick(avatarUrl: string): void {
        this.selectedAvatar = avatarUrl;
    }
    buttonRegister(): void {
        this.authentification.register(this.usernameInput, this.emailInput, this.passwordInput, this.selectedAvatar);
    }

    redirectToLogin(): void {
        this.router.navigate([TO_LOGIN]);
    }

    setVisibility(): void {
        this.isPasswordVisible = !this.isPasswordVisible;
    }
}
