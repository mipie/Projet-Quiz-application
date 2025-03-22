export const WEB_TITLE = 'KAM? PAF!';
export const TO_HOME = 'home';
export const TO_JOIN_GAME = 'join';
export const TO_CREATE_PLAY = 'createPlay';
export const TO_HOST = 'host';
export const TO_PLAY_GAME = 'game';
export const TO_TEST_GAME = 'demo';
export const TO_ORGANIZER = 'organizer';
export const TO_LOGIN = 'login';
export const TO_REGISTER = 'register';
export const TO_ADMIN = 'admin';
export const TO_CREATE_GAME = 'createGame';
export const TO_MODIFY_GAME = 'modifyGame';
export const TO_RESULT = 'result';
export const TO_CHAT = 'chat';
export const TO_LOBBIES = 'lobbies';
export const TO_OBSERVER = 'observer';

export const MIN_POINTS = 10;
export const MAX_POINTS = 100;

export const MIN_CHOICES = 2;
export const MAX_CHOICES = 4;

export const MIN_GAME_DURATION = 10;
export const MAX_GAME_DURATION = 60;

export const INTERACTION_INTERVAL = 5;
export const MAX_PANIC_TIME_QCM = 10;
export const MAX_PANIC_TIME_QRL = 20;
export const WAIT_TIME = 3000;
export const DEFAULT_INTERVAL = 1000;

export const SCORE_DIVISOR_TO_INDEX = 50;
export const DEFAULT_BONUS = 1.2;
export const NEW_ID = -1;

export const MAX_TEXT_COUNT = 200;
export const MAX_NAME_INPUT_COUNT = 11;

export const MIN_LENGTH_PASSWORD = 6;

export const MAX_MARGIN = 25;
export const MIN_MARGIN = 0;
export const DIVISOR = 100;
export const VERIFICATOR_INTERVAL = 1;

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const MAX_SIZE_IMAGE = 1024 * 1024;

export const GAMES_PROPERTIES = {
    $schema: 'string',
    title: 'string',
    description: 'string',
    duration: 'number',
    lastModification: 'string',
    questions: 'object',
};
export const QUESTION_PROPERTIES = {
    type: 'string',
    text: 'string',
    points: 'number',
    imageUrl: 'array',
};
export const CHOICES_PROPERTIES = {
    text: 'string',
    isCorrect: 'boolean',
};

export const QRE_PROPERTIES = {
    lowerBound: 'number',
    goodAnswer: 'number',
    margin: 'number',
    upperBound: 'number',
};
