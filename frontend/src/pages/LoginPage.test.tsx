import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('renders the sign-in form with demo credentials pre-filled', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    expect(screen.getByRole('heading', { name: /darukaa\.earth/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveValue('demo@darukaa.earth');
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
