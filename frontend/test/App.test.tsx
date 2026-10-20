import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

describe('App', () => {
  it('renders the booking page', async () => {
    render(<App />);
    expect(await screen.findByText('Book a call')).toBeInTheDocument();
  });
});
