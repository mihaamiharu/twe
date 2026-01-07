import { describe, test, expect, afterEach } from 'bun:test';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { Input } from '../../../../components/ui/input';
import React from 'react';

describe('Input Component', () => {
  afterEach(() => {
    cleanup();
  });

  test('renders input with default props', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  test('accepts value and onChange props', () => {
    let value = '';
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      value = e.target.value;
    };
    render(<Input value={value} onChange={handleChange} placeholder="Type here" />);
    const input = screen.getByPlaceholderText('Type here');

    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(value).toBe('Hello');
  });

  test('renders with different types', () => {
    const { rerender } = render(<Input type="password" placeholder="Password" />);
    let input = screen.getByPlaceholderText('Password');
    expect(input).toHaveAttribute('type', 'password');

    rerender(<Input type="email" placeholder="Email" />);
    input = screen.getByPlaceholderText('Email');
    expect(input).toHaveAttribute('type', 'email');
  });

  test('is disabled when disabled prop is set', () => {
    render(<Input disabled placeholder="Disabled" />);
    const input = screen.getByPlaceholderText('Disabled');
    expect(input).toBeDisabled();
  });

  test('applies custom class names', () => {
    render(<Input className="custom-class" placeholder="Custom" />);
    const input = screen.getByPlaceholderText('Custom');
    expect(input.className).toContain('custom-class');
  });
});
