/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren, inject } from '@angular/core';
import { DIVISOR, MAX_CHOICES, MAX_SIZE_IMAGE, MIN_CHOICES, VERIFICATOR_INTERVAL } from '@app/constants';
import { Choice } from '@app/interfaces/choice/choice';
import { ErrorsQuestion } from '@app/interfaces/errors/errors-question';
import { Qre } from '@app/interfaces/question/qre';
import { Question } from '@app/interfaces/question/question';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { LangueService } from '@app/services/langues/langue.service';
import { SoundService } from '@app/services/sound/sound.service';
import { ValidateFormService } from '@app/services/verification/validate-form.service';
import { ADDANSWER, ADDQUESTION, FIRSTBROWSE, MARGIN, SECONDBROWSE } from './constants';

@Component({
    selector: 'app-question-form',
    templateUrl: './question-form.component.html',
    styleUrls: ['./question-form.component.scss'],
})
export class QuestionFormComponent implements OnInit {
    @ViewChildren('requiredInput') requiredInputList: QueryList<ElementRef>;
    @Input() questions: Question[] = [];
    @Output() private areQuestionsValidEvent = new EventEmitter<boolean>();
    errors: ErrorsQuestion[] = [];
    errorSizeImage: string | null;
    totalSizeImages: number;
    currentUser: User | null;
    firstBrowseLabel: string = '';
    secondBrowseLabel: string = '';
    marginLabel: string = '';
    addAnswerLabel: string = '';
    addQuestionLabel: string = '';
    language: string = '';
    private areQuestionsValid: boolean = false;
    private validationService = inject(ValidateFormService);
    private soundService: SoundService = inject(SoundService);
    private authentificationService: AuthService = inject(AuthService);
    private languageService: LangueService = inject(LangueService);

    async ngOnInit(): Promise<void> {
        this.errors = Array.from({ length: this.questions.length }, () => new ErrorsQuestion());
        this.currentUser = await this.authentificationService.getCurrentUser();
        if (this.currentUser) {
            this.languageService.currentLanguage(this.currentUser).subscribe((language) => {
                this.language = language;
                this.updatedLabelLanguage(language);
            });
        }
    }

    updatedLabelLanguage(language: string): void {
        this.firstBrowseLabel = FIRSTBROWSE[language];
        this.secondBrowseLabel = SECONDBROWSE[language];
        this.marginLabel = MARGIN[language];
        this.addAnswerLabel = ADDANSWER[language];
        this.addQuestionLabel = ADDQUESTION[language];
    }

    onFileSelected(event: Event, question: Question): void {
        const input = event.target as HTMLInputElement;

        if (input.files && input.files[0]) {
            const file = input.files[0];
            question.imageFiles = file;

            if (file.size > MAX_SIZE_IMAGE) {
                if (this.language === 'fra') {
                    this.errorSizeImage = `La taille de l'image dépasse la limite maximal de ${1} MB.`;
                } else {
                    this.errorSizeImage = `Image size exceeds maximum limit of ${1} MB.`;
                }
                question.imageUrl = undefined;
                return;
            }

            this.errorSizeImage = null;
            const reader = new FileReader();
            reader.onload = (e) => {
                question.imageUrl![0] = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    changeQuestion(event: Event, question: Question): void {
        const selectedType = (event.target as HTMLSelectElement).value;

        if (selectedType === 'QCM' && question.choices!.length < 2) {
            question.choices = [new Choice(), new Choice()];
        }

        if (selectedType === 'QRE' && question.qre === undefined) {
            question.qre = new Qre();
        }
    }

    calculateMargin(question: Question, isUpper: boolean): number | boolean {
        if (!question.qre || !question.qre.margin || !question.qre.goodAnswer) {
            return false;
        }
        const margin = question.qre.margin / DIVISOR;
        const lowerBound = question.qre.lowerBound as number;
        const goodAnswer = question.qre.goodAnswer;
        const upperBound = question.qre.upperBound as number;
        const intervalSize = upperBound - lowerBound;

        const adjustment = Math.round(margin * intervalSize * (isUpper ? VERIFICATOR_INTERVAL : -VERIFICATOR_INTERVAL));
        let result = goodAnswer + adjustment;

        if (isUpper && result > upperBound) {
            result = upperBound;
        } else if (result < lowerBound) {
            result = lowerBound;
        }

        if (goodAnswer > upperBound || goodAnswer < lowerBound) {
            return false;
        }

        return Math.round(result);
    }

    changeFocus(event: Event, element: HTMLElement) {
        event.preventDefault();
        const index = this.requiredInputList.toArray().findIndex((input) => input.nativeElement === element);
        if (index !== this.requiredInputList.length - 1) this.requiredInputList.toArray()[index + 1].nativeElement.focus();
    }

    sendAreQuestionsValid() {
        this.errors = this.validationService.verifyAllQuestions();
        this.areQuestionsValid = this.errors.find((error) => Boolean(error.choicesError || error.pointsError || error.textError || error.typeError))
            ? false
            : true;
        this.areQuestionsValidEvent.emit(this.areQuestionsValid);
    }

    addQuestion(): void {
        this.clickedButton();
        const newQuestion: Question = new Question();
        newQuestion.type = 'QRL';
        newQuestion.choices = [new Choice(), new Choice()];
        this.questions.push(newQuestion);
        this.errors.push(new ErrorsQuestion());
    }

    deleteQuestion(i: number): void {
        if (this.questions.length > 0) {
            this.questions.splice(i, 1);
            this.errors.splice(i, 1);
        }
    }

    addChoice(i: number) {
        this.clickedButton();
        if (this.questions[i].choices!.length >= MIN_CHOICES && this.questions[i].choices!.length < MAX_CHOICES) {
            this.errors[i].choicesError = '';
            this.questions[i].choices!.push(new Choice());
        }
    }

    deleteChoice(i: number, j: number) {
        if (this.questions[i].choices!.length > 2) this.questions[i].choices!.splice(j, 1);
    }

    dropQuestion(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.questions, event.previousIndex, event.currentIndex);
    }

    dropAnswer(event: CdkDragDrop<string[]>, i: number) {
        moveItemInArray(this.questions[i].choices!, event.previousIndex, event.currentIndex);
    }

    clickedButton(): void {
        this.soundService.buttonClick();
    }
}
