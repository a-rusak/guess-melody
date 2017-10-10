export const QUESTIONS_COUNT = 10;

// const PRICE_OF_ERROR = 2;
export const MAX_ERRORS_COUNT = 4;
const sum = (arr) => arr.reduce((acc, item) => acc + item);
// const penalty = (rest) => (MAX_ERRORS_COUNT - rest) * PRICE_OF_ERROR;

export const resultsCount = ({attempt, rest}) => {
  let result = -1;

  if (attempt.length === QUESTIONS_COUNT) {
    // result = sum(attempt) - penalty(rest);
    result = sum(attempt);
  }
  return result;
};
