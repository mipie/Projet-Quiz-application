import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class SharedIdService {
    private static identifier: number | undefined = undefined;

    static get id(): number | undefined {
        return SharedIdService.identifier;
    }

    static set id(id: number | undefined) {
        SharedIdService.identifier = id;
    }
}
