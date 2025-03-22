import { Injectable } from '@angular/core';
import { getStorage } from 'firebase/storage';

@Injectable({
    providedIn: 'root',
})
export class Firebase2StorageService {
    private storage = getStorage();

    getStorageRef() {
        return this.storage;
    }
}
