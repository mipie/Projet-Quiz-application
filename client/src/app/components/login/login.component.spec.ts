import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LoginComponent } from './login.component';
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SoundService } from '@app/services/sound/sound.service';

describe('ConnexionMDPComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let router: Router;
    let http: HttpClient;
    let songspyService: SoundService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [LoginComponent],
            imports: [RouterTestingModule, HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [SoundService],
        });
        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        router = TestBed.inject(Router);
        http = TestBed.inject(HttpClient);
        songspyService = TestBed.inject(SoundService);
        spyOn(songspyService, 'buttonClick').and.returnValue();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should enter admin if the valid pasword is entered', () => {
        component.passwordInput = 'passwordIsCorrect';
        const postspy = spyOn(http, 'post').and.returnValue(of(true));
        const navigateSpy = spyOn(router, 'navigate');
        component.verifyPassword();
        expect(postspy).toHaveBeenCalledWith(`${environment.serverUrl}/connexion-mdp/password`, { password: component.passwordInput });
        expect(navigateSpy).toHaveBeenCalledWith(['admin']);
    });

    it('should stay on connexion if an invalid pasword is entered', () => {
        component.passwordInput = 'invalidPassword';
        const postspy = spyOn(http, 'post').and.returnValue(of(false));
        component.verifyPassword();
        expect(postspy).toHaveBeenCalledWith(`${environment.serverUrl}/connexion-mdp/password`, { password: component.passwordInput });
        expect(component.errorMessage).toContain('* Le mot de passe est incorrect.');
    });

    it('should set the input type to password', () => {
        component.isPasswordVisible = false;
        component.setVisibility();
        expect(component.input.nativeElement.type).toEqual('password');
        expect(component.isPasswordVisible).toBeTrue();
    });

    it('should set the input type to text', () => {
        component.isPasswordVisible = true;
        component.setVisibility();
        expect(component.input.nativeElement.type).toEqual('text');
        expect(component.isPasswordVisible).toBeFalse();
    });

    it('should call soundService.buttonClick on clickedButton', () => {
        component.buttonClick();
        expect(songspyService.buttonClick).toHaveBeenCalled();
    });
});
