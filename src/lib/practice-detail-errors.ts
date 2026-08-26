export type PracticeDetailErrorCode = 'not-found' | 'operational';

export interface PracticeDetailFailure {
  success: false;
  errorCode: PracticeDetailErrorCode;
  error: string;
}

export function practiceDetailNotFoundFailure(): PracticeDetailFailure {
  return {
    success: false,
    errorCode: 'not-found',
    error: 'Challenge not found',
  };
}

export function practiceDetailOperationalFailure(
  error = 'An error occurred while processing your request.',
): PracticeDetailFailure {
  return {
    success: false,
    errorCode: 'operational',
    error,
  };
}
