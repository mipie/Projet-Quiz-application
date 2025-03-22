/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Component, Input, OnInit, inject } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
    selector: 'app-minigame',
    templateUrl: './minigame.component.html',
    styleUrls: ['./minigame.component.scss'],
})
export class MinigameComponent implements OnInit {
    @Input() language: string = '';
    imageSrc: string;
    losses: number = 0;
    isGameLost: boolean = false;
    isGameWon: boolean = false;
    message: string[] = ['', ''];
    mainWord: string = '';
    normalizedMainWord: string = '';
    guessedLetters: string[] = [];
    answer: string = '';
    incorrectLetters: string[] = [];
    alphabet: string[] = 'abcdefghijklmnopqrstuvwxyz'.split('');
    private fireStore = inject(AngularFirestore);

    async ngOnInit(): Promise<void> {
        this.setWord(this.language);
        this.setImageSrc();
    }

    updateImageSrc() {
        this.losses += 1;
        if (this.losses === 6) {
            this.isGameLost = true;
            this.message = ['Domage !', 'Vous avez perdu, le mot restera secret !'];
        }
        this.imageSrc = `./assets/miniGame/miniGame${this.losses}.png`;
    }

    handleKeydown(event: KeyboardEvent) {
        this.message = ['', ''];
        const key = event.key.toLowerCase();
        const allowedSpecialKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'];

        if (event.key === 'Enter') {
            this.sendAnswer();
        }
        if (allowedSpecialKeys.includes(event.key)) {
            return;
        }
        if (!this.alphabet.includes(key)) {
            event.preventDefault();
        } else {
            this.answer = key;
        }
    }

    sendAnswer() {
        if (this.normalizedMainWord.includes(this.answer)) {
            if (!this.guessedLetters.includes(this.answer)) {
                this.guessedLetters.push(this.answer);
                let isGameWon = true;
                for (const letter of this.normalizedMainWord) {
                    if (!this.guessedLetters.includes(letter)) {
                        isGameWon = false;
                        break;
                    }
                }
                this.isGameWon = isGameWon;
                if (this.isGameWon) {
                    this.message = ['Bravo !', 'Vous avez gagné cette partie !'];
                }
            } else {
                this.message = ['Vous avez déjà entré cette lettre.', ''];
            }
        } else {
            if (!this.incorrectLetters.includes(this.answer)) {
                this.incorrectLetters.push(this.answer);
                this.updateImageSrc();
            } else {
                this.message = ['Vous avez déjà entré cette lettre.', ''];
            }
        }
        this.answer = '';
    }

    restart() {
        this.losses = 0;
        this.isGameWon = false;
        this.isGameLost = false;
        this.message = ['', ''];
        this.guessedLetters = [];
        this.incorrectLetters = [];
        this.setWord(this.language);
        this.setImageSrc();
    }

    setImageSrc() {
        this.imageSrc = `./assets/miniGame/miniGame${this.losses}.png`;
    }

    normalizeString(str: string): string {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    async setWord(language: string) {
        let lang = 'ang';
        if (language === 'fra') {
            lang = 'fr';
        }
        const randomIndex = Math.floor(Math.random() * 9);
        const languageCollection = 'words-' + lang;

        const channel = this.fireStore.collection('minigame').doc(languageCollection);
        const document = await channel.get().toPromise();
        const data = document?.data() as { [key: number]: string };
        this.mainWord = data[randomIndex];
        this.normalizedMainWord = this.normalizeString(this.mainWord);
    }
}
