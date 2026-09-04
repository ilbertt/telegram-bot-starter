export function apiErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'value' in error) {
    const value = (error as { value?: { error?: string } }).value;
    if (value?.error) {
      return value.error;
    }
  }
  return 'Request failed';
}
