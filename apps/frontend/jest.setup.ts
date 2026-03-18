import '@testing-library/jest-dom';
import React from 'react';

const mockIcon = (name: string) => (props: any) => React.createElement('div', { ...props, 'data-testid': `${name}-icon` });

const icons: any = {
  Mail: mockIcon('mail'),
  Lock: mockIcon('lock'),
  Loader2: mockIcon('loader'),
  ArrowRight: mockIcon('arrow-right'),
};

jest.mock('lucide-react', () => {
    return new Proxy(icons, {
        get: (target, prop) => {
            if (prop in target) return target[prop];
            return mockIcon(String(prop).toLowerCase());
        }
    });
});
