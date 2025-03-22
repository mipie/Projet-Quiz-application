import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private isCorrect: boolean = false;

    get isPasswordCorrect(): boolean {
        return this.isCorrect;
    }

    set isPasswordCorrect(value: boolean) {
        this.isCorrect = value;
    }
}
