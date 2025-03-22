/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable, inject } from '@angular/core';
import { DIVISOR, VERIFICATOR_INTERVAL } from '@app/constants';
import { Choice } from '@app/interfaces/choice/choice';
import { Question } from '@app/interfaces/question/question';
import { RoomService } from '@app/services/room-game/room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';

@Injectable({
    providedIn: 'root',
})
export class GamePlayService {
    private roomService: RoomService = inject(RoomService);
    private socketService: SocketsService = inject(SocketsService);

    onKeydownNumber(event: KeyboardEvent, selectedChoice: boolean[], choicesIndex: number): void {
        const targetElement = event.target as HTMLElement;
        if (targetElement) {
            if (targetElement.id !== 'message-input' && Number(event.key) > 0 && Number(event.key) <= choicesIndex) {
                selectedChoice[Number(event.key) - 1] = !selectedChoice[Number(event.key) - 1];
                if (this.roomService.activeGame) this.socketService.send('setChoice', Number(event.key));
            }
        }
    }

    isConfirmAnswerSelected(selectedChoice: boolean[], choicesIndex: number | undefined, time: number | null): boolean {
        let isSelected = false;
        for (let i = 0; i <= choicesIndex!; i++) {
            if (selectedChoice[i] || time === 0) {
                isSelected = true;
                break;
            }
        }
        return isSelected;
    }

    rightAnswer(selectedChoice: boolean[], choicesIndex: number, questionChoices: Choice[] | undefined): boolean {
        for (let i = 0; i < choicesIndex!; i++) {
            if (questionChoices![i].isCorrect !== selectedChoice[i]) return false;
        }
        return true;
    }

    calculateMargin(question: Question, isUpper: boolean): number {
        if (!question.qre || !question.qre.margin || !question.qre.goodAnswer) {
            return 0;
        }
        const margin = question.qre.margin / DIVISOR;
        const lowerBound = question.qre.lowerBound as number;
        const goodAnswer = question.qre.goodAnswer;
        const upperBound = question.qre.upperBound as number;
        const intervalSize = upperBound - lowerBound;

        const adjustment = margin * intervalSize * (isUpper ? VERIFICATOR_INTERVAL : -VERIFICATOR_INTERVAL);
        let result = goodAnswer + adjustment;

        if (isUpper && result > upperBound) {
            result = upperBound;
        } else if (result < lowerBound) {
            result = lowerBound;
        }
        return Math.round(result);
    }

    rightAnswerQre(question: Question, sliderValue: number) {
        if (question.qre?.goodAnswer === sliderValue) {
            return true;
        }
        return false;
    }

    answerWithinMarginBoundary(question: Question, sliderValue: number) {
        const lowerMargin = this.calculateMargin(question, false);
        const upperMargin = this.calculateMargin(question, true);

        if (sliderValue > lowerMargin && sliderValue < upperMargin) {
            if (question.qre?.margin !== 0) {
                return true;
            }
        }
        return false;
    }
}
