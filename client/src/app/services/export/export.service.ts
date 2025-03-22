/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-underscore-dangle */
import { ElementRef, Injectable } from '@angular/core';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';

@Injectable({
    providedIn: 'root',
})
export class ExportService {
    async exportGame(anchor: ElementRef, gameDetails: GameDetails): Promise<void> {
        gameDetails = this.deleteMongoIds(gameDetails);
        gameDetails = this.deleteIds(gameDetails);
        const binaryData = new Blob([JSON.stringify(gameDetails.game)], { type: 'application/json' });
        const url = window.URL.createObjectURL(binaryData);
        const downloadLink = anchor.nativeElement as HTMLAnchorElement;
        downloadLink.href = url;
        downloadLink.download = gameDetails.game.$schema;
        downloadLink.click();
        window.URL.revokeObjectURL(url);
    }

    deleteMongoIds(gameData: GameDetails): GameDetails {
        delete gameData._id;
        delete gameData.game._id;
        for (const question of gameData.game.questions) {
            delete question._id;
            switch (question.type) {
                case 'QRL': {
                    delete question.choices;
                    delete question.qre;
                    if (question.imageFiles !== undefined) {
                        delete question.imageFiles;
                    }
                    if (question.imageUrl === null) {
                        delete question.imageUrl;
                    }

                    break;
                }
                case 'QCM': {
                    for (const choice of question.choices!) {
                        delete choice._id;
                    }
                    delete question.qre;
                    if (question.imageFiles !== undefined) {
                        delete question.imageFiles;
                    }
                    if (question.imageUrl === null) {
                        delete question.imageUrl;
                    }

                    break;
                }
                case 'QRE': {
                    delete question.choices;
                    delete question.qre!._id;
                    if (question.imageFiles !== undefined) {
                        delete question.imageFiles;
                    }
                    if (question.imageUrl === null) {
                        delete question.imageUrl;
                    }
                    break;
                }
            }
        }
        return gameData;
    }

    private deleteIds(gameData: GameDetails): GameDetails {
        delete gameData.id;
        for (const question of gameData.game.questions) {
            delete question.id;
            if (question.type === 'QCM') {
                for (const choice of question.choices!) {
                    delete choice.id;
                }
            }
        }
        return gameData;
    }
}
