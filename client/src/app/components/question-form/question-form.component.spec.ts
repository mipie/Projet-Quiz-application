/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Choice } from '@app/interfaces/choice/choice';
import { ErrorsQuestion } from '@app/interfaces/errors/errors-question';
import { Question } from '@app/interfaces/question/question';
import { ValidateFormService } from '@app/services/verification/validate-form.service';
import { QuestionFormComponent } from './question-form.component';
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SoundService } from '@app/services/sound/sound.service';

describe('QuestionFormComponent', () => {
    let component: QuestionFormComponent;
    let fixture: ComponentFixture<QuestionFormComponent>;
    let validateFormServiceSpy: jasmine.SpyObj<ValidateFormService>;
    let songspyService: SoundService;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('ValidateFormService', ['verifyAllQuestions']);

        TestBed.configureTestingModule({
            declarations: [QuestionFormComponent],
            providers: [{ provide: ValidateFormService, useValue: spy }, SoundService],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        });

        fixture = TestBed.createComponent(QuestionFormComponent);
        component = fixture.componentInstance;
        validateFormServiceSpy = TestBed.inject(ValidateFormService) as jasmine.SpyObj<ValidateFormService>;
        songspyService = TestBed.inject(SoundService);
        spyOn(songspyService, 'buttonClick').and.returnValue();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize errors array in ngOnInit', () => {
        component.questions = [new Question(), new Question()];
        component.ngOnInit();
        expect(component.errors.length).toBe(2);
    });

    it('should change focus correctly', () => {
        const mockEvent = { preventDefault: jasmine.createSpy('preventDefault') };
        const mockElement1 = document.createElement('div');
        const mockElement2 = document.createElement('div');
        const mockElement3 = document.createElement('div');

        component.requiredInputList = {
            toArray: () => [{ nativeElement: mockElement1 }, { nativeElement: mockElement2 }, { nativeElement: mockElement3 }],
            length: 3,
        } as any;

        spyOn(mockElement2, 'focus');

        component.changeFocus(mockEvent as any, mockElement1);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockElement2.focus).toHaveBeenCalled();
    });

    it('should send false when there are validation errors', () => {
        const errors = [new ErrorsQuestion(), new ErrorsQuestion()];
        errors[0].textError = 'Text error';

        validateFormServiceSpy.verifyAllQuestions.and.returnValue(errors);

        spyOn((component as any).areQuestionsValidEvent, 'emit');

        component.sendAreQuestionsValid();

        expect((component as any).areQuestionsValid).toBeFalse();
        expect((component as any).areQuestionsValidEvent.emit).toHaveBeenCalledWith(false);
    });

    it('should send true when there are no validation errors', () => {
        const errors = [new ErrorsQuestion(), new ErrorsQuestion()];

        validateFormServiceSpy.verifyAllQuestions.and.returnValue(errors);

        spyOn((component as any).areQuestionsValidEvent, 'emit');

        component.sendAreQuestionsValid();

        expect((component as any).areQuestionsValid).toBeTrue();
        expect((component as any).areQuestionsValidEvent.emit).toHaveBeenCalledWith(true);
    });

    it('should add a new question', () => {
        component.addQuestion();
        expect(component.questions.length).toBe(1);
        expect(component.errors.length).toBe(1);
    });

    it('should delete a question', () => {
        component.questions = [new Question(), new Question()];
        component.errors = [new ErrorsQuestion(), new ErrorsQuestion()];
        component.deleteQuestion(0);
        expect(component.questions.length).toBe(1);
        expect(component.errors.length).toBe(1);
    });

    it('should add a new choice to a question', () => {
        component.questions = [
            {
                id: 111,
                type: 'QCM',
                text: '',
                points: 10,
                choices: [
                    {
                        id: 1,
                        text: 'kl',
                        isCorrect: true,
                    },
                    {
                        id: 2,
                        text: 'kls',
                        isCorrect: true,
                    },
                ],
            },
        ];
        const questionIndex = 0;
        component.errors = [{ choicesError: '', pointsError: '', textError: '', typeError: '', lengthError: '' }];

        const initialChoicesCount = component.questions[questionIndex].choices!.length;

        component.addChoice(questionIndex);

        expect(component.questions[questionIndex].choices!.length).toBe(initialChoicesCount + 1);
        expect(component.errors[questionIndex].choicesError).toBe('');
    });

    it('should delete a choice from a question', () => {
        component.questions = [new Question()];
        component.questions[0].choices?.push(new Choice(), new Choice(), new Choice());
        component.deleteChoice(0, 0);
        expect(component.questions[0].choices?.length).toBe(2);
    });

    it('should move a question within the questions array', () => {
        const initialQuestions: Question[] = [
            { id: 1, text: 'Question 1', type: 'Type 1', points: 10, choices: [new Choice(), new Choice()] },
            { id: 2, text: 'Question 2', type: 'Type 2', points: 20, choices: [new Choice(), new Choice()] },
            { id: 3, text: 'Question 3', type: 'Type 3', points: 30, choices: [new Choice(), new Choice()] },
        ];

        component.questions = initialQuestions;
        const previousIndex = 0;
        const currentIndex = 2;

        const cdkDragDropEvent: CdkDragDrop<string[]> = {
            previousIndex,
            currentIndex,
            item: null as unknown as CdkDrag<any>,
            container: null as unknown as CdkDropList<any>,
            isPointerOverContainer: false,
            distance: { x: 0, y: 0 },
            previousContainer: null as unknown as CdkDropList<any>,
            dropPoint: {
                x: 0,
                y: 0,
            },
            event: null as unknown as MouseEvent | TouchEvent,
        };

        component.dropQuestion(cdkDragDropEvent);

        expect(component.questions[previousIndex]).toEqual(initialQuestions[previousIndex]);
    });

    it('should move answers within a question', () => {
        const mockQuestions: Question[] = [
            {
                id: 1,
                text: 'Question 1',
                type: 'Type 1',
                points: 10,
                choices: [
                    { id: 1, text: '', isCorrect: true },
                    { id: 2, text: '', isCorrect: true },
                    { id: 3, text: '', isCorrect: true },
                ],
            },
        ];

        component.questions = mockQuestions;
        const initialChoices = component.questions[0].choices!.slice();

        const dragDropEvent: CdkDragDrop<string[]> = {
            previousIndex: 0,
            currentIndex: 2,
            item: null as unknown as CdkDrag<any>,
            container: null as unknown as CdkDropList<any>,
            isPointerOverContainer: false,
            distance: { x: 0, y: 0 },
            previousContainer: null as unknown as CdkDropList<any>,
            dropPoint: {
                x: 0,
                y: 0,
            },
            event: null as unknown as MouseEvent | TouchEvent,
        };

        component.dropAnswer(dragDropEvent, 0);

        expect(component.questions[0].choices).toEqual([initialChoices[1], initialChoices[2], initialChoices[0]]);
    });
});
