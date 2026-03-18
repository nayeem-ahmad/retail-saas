import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from './page';

// Mock the Next router seamlessly
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

// Mock API layer
jest.mock('../../lib/api', () => ({
  api: {
    login: jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: 'fake-token' })
    }),
    getMe: jest.fn().mockResolvedValue({
        tenants: []
    })
  }
}));

describe('Login UI Authentication Mapping', () => {
  it('renders email authentication correctly', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('updates email and password state', () => {
      render(<LoginPage />);
      const emailInput = screen.getByPlaceholderText(/name@company.com/i);
      const passInput = screen.getByPlaceholderText(/••••••••/i);

      fireEvent.change(emailInput, { target: { value: 'admin@bmad.com' } });
      fireEvent.change(passInput, { target: { value: 'password123' } });

      expect(emailInput).toHaveValue('admin@bmad.com');
      expect(passInput).toHaveValue('password123');
  });

  it('submits the form successfully', async () => {
    const { api } = require('../../lib/api');
    render(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText(/name@company.com/i), { target: { value: 'admin@bmad.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(api.login).toHaveBeenCalledWith({
        email: 'admin@bmad.com',
        password: 'password123'
    });
  });

  it('displays error message on failed login', async () => {
    const { api } = require('../../lib/api');
    api.login.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    render(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText(/name@company.com/i), { target: { value: 'wrong@bmad.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'wrong' } });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const errorMsg = await screen.findByText(/Invalid credentials/i);
    expect(errorMsg).toBeInTheDocument();
  });

  it('sets tenant and store in localStorage on successful login', async () => {
    const { api } = require('../../lib/api');
    api.login.mockResolvedValueOnce({ access_token: 't-123' });
    api.getMe.mockResolvedValueOnce({
        tenants: [{
            id: 'tenant-1',
            stores: [{ id: 'store-1' }]
        }]
    });
    
    render(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText(/name@company.com/i), { target: { value: 'admin@bmad.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const { useRouter } = require('next/navigation');
    const router = useRouter();
    
    await new Promise(resolve => setTimeout(resolve, 10)); // wait for async

    expect(localStorage.getItem('tenant_id')).toBe('tenant-1');
    expect(localStorage.getItem('store_id')).toBe('store-1');
  });
});
