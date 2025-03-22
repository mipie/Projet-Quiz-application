/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class WindowsService {
    private static isWindowOpen = false;

    static closeWindow() {
        WindowsService.isWindowOpen = false;
    }

    static openWindow() {
        WindowsService.isWindowOpen = true;
    }

    static get windowState() {
        return WindowsService.isWindowOpen;
    }
}
