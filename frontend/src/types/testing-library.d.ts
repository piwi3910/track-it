/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R = void> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveClass(className: string): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveStyle(css: Record<string, any>): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(html: string): R;
      toHaveValue(value: string | string[] | number): R;
      toHaveDisplayValue(value: string | string[]): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveFocus(): R;
      toHaveFormValues(expectedValues: Record<string, any>): R;
      toHaveDescription(text: string | RegExp): R;
      toHaveErrorMessage(text: string | RegExp): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeEmptyDOMElement(): R;
    }
  }
}