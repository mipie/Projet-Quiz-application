import { Injectable } from '@angular/core';
import { Firebase2StorageService } from '@app/services/second-firebase/firebase2-storage.service';
import { getDownloadURL, ref, uploadBytes } from '@firebase/storage';
import imageCompression from 'browser-image-compression';

@Injectable({
    providedIn: 'root',
})
export class ImageService {
    constructor(private firebase2StorageService: Firebase2StorageService) {}
    async uploadImage(file: File): Promise<string> {
        const storage = this.firebase2StorageService.getStorageRef();
        const storageRef = ref(storage, `images/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        return url;
    }

    async compressImage(file: File): Promise<File> {
        const options = {
            maxSize: 0.8,
            maxWidthOrHeight: 300,
            useWebWorker: true,
            initialQuality: 0.7,
            fileType: 'image/jpg',
        };

        return imageCompression(file, options).then((compressedFile: File) => {
            return compressedFile;
        });
    }
}
