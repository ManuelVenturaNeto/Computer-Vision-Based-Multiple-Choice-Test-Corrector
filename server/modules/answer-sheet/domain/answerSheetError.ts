export class AnswerSheetReadError extends Error {}
export class AnswerSheetInvalidInputError extends AnswerSheetReadError {}
export class AnswerSheetUnreadableError extends AnswerSheetReadError {}
export class AnswerSheetAiFallbackError extends Error {}
