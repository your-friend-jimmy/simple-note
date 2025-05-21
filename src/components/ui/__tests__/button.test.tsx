import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, buttonVariants } from '../button'; // Adjust path as necessary
import { cn } from '@/lib/utils'; // Import cn for direct comparison

describe('Button Component', () => {
  test('renders correctly with default props', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toBeInTheDocument();
    // Compare with what cn would produce
    expect(buttonElement.className).toEqual(cn(buttonVariants({ variant: 'default', size: 'default' })));
  });

  test('applies variant classes correctly (destructive)', () => {
    render(<Button variant="destructive">Delete</Button>);
    const buttonElement = screen.getByRole('button', { name: /delete/i });
    // Check specific classes that should be present for destructive
    expect(buttonElement.classList.contains('bg-destructive')).toBe(true);
    expect(buttonElement.classList.contains('text-white')).toBe(true);
    expect(buttonElement.classList.contains('focus-visible:ring-destructive/20')).toBe(true);
    // Check that the generic focus ring (if different) is overridden or not present if destructive provides its own
    expect(buttonElement.classList.contains('focus-visible:ring-ring/50')).toBe(false);
  });

  test('applies size classes correctly (sm)', () => {
    render(<Button size="sm">Small Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /small button/i });
    // Check specific classes for sm size
    expect(buttonElement.classList.contains('h-8')).toBe(true);
    expect(buttonElement.classList.contains('gap-1.5')).toBe(true);
    // Check that default gap (if different) is overridden
    expect(buttonElement.classList.contains('gap-2')).toBe(false);
  });

  test('handles onClick event', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    const buttonElement = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('renders as a child component when asChild prop is true', () => {
    render(
      <Button asChild>
        <a href="/#">Link Button</a>
      </Button>
    );
    // Check if it rendered as an 'a' tag instead of 'button'
    const linkElement = screen.getByRole('link', { name: /link button/i });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement.tagName).toBe('A');
    // Check if default button classes are still applied (via cn)
    expect(linkElement.className).toEqual(cn(buttonVariants({ variant: 'default', size: 'default' })));
  });

  test('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const buttonElement = screen.getByRole('button', { name: /custom/i });
    // Check if the custom class is present
    expect(buttonElement.classList.contains('custom-class')).toBe(true);
    // Check that the final className matches what cn would produce with the custom class
    expect(buttonElement.className).toEqual(cn(buttonVariants({ variant: 'default', size: 'default', className: 'custom-class' })));
  });

  test('is disabled when disabled prop is true', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const buttonElement = screen.getByRole('button', { name: /disabled/i });
    expect(buttonElement).toBeDisabled();
    fireEvent.click(buttonElement);
    expect(handleClick).not.toHaveBeenCalled();
  });

  // Test for different variants and sizes combinations
  const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
  const sizes = ['default', 'sm', 'lg', 'icon'] as const;

  variants.forEach(variant => {
    sizes.forEach(size => {
      test(`renders correctly with variant ${variant} and size ${size}`, () => {
        render(<Button variant={variant} size={size}>{`${variant} ${size}`}</Button>);
        const buttonElement = screen.getByRole('button', { name: new RegExp(`${variant} ${size}`, 'i') });
        expect(buttonElement).toBeInTheDocument();
        // Compare the actual className with what cn(buttonVariants(...)) would produce
        // This is the most accurate way to test the final classes applied by the component
        expect(buttonElement.className).toEqual(cn(buttonVariants({ variant, size })));
      });
    });
  });

  test('renders icon correctly when size is icon', () => {
    render(<Button size="icon" aria-label="icon button"><svg /></Button>);
    const buttonElement = screen.getByRole('button', { name: /icon button/i });
    expect(buttonElement.className).toEqual(cn(buttonVariants({ size: 'icon' })));
    expect(buttonElement.classList.contains('size-9')).toBe(true);
  });

});
