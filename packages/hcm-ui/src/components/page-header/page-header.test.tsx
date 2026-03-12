import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PageHeader } from './page-header';

describe('PageHeader', () => {
  describe('rendering', () => {
    it('renders title', () => {
      render(<PageHeader title="Company List" />);

      expect(screen.getByText('Company List')).toBeInTheDocument();
    });

    it('renders title as h1', () => {
      render(<PageHeader title="Company List" />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Company List');
    });

    it('renders ReactNode title', () => {
      render(<PageHeader title={<span data-testid="custom-title">Custom Title</span>} />);

      expect(screen.getByTestId('custom-title')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(<PageHeader title="Companies" description="Manage company records" />);

      expect(screen.getByText('Manage company records')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(<PageHeader title="Companies" />);

      expect(screen.queryByText('Manage company records')).not.toBeInTheDocument();
    });

    it('renders ReactNode description', () => {
      render(
        <PageHeader
          title="Companies"
          description={<span data-testid="custom-desc">Custom description</span>}
        />,
      );

      expect(screen.getByTestId('custom-desc')).toBeInTheDocument();
    });
  });

  describe('breadcrumbs', () => {
    it('renders breadcrumbs when provided', () => {
      render(
        <PageHeader
          title="Employee Details"
          breadcrumbs={[
            { label: 'Personal Data Center', href: '/personal-data-center' },
            { label: 'Employee Details' },
          ]}
        />,
      );

      expect(screen.getByText('Personal Data Center')).toBeInTheDocument();
    });

    it('renders intermediate items as links', () => {
      render(
        <PageHeader
          title="Employee Details"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Personal Data Center', href: '/personal-data-center' },
            { label: 'Employee Details' },
          ]}
        />,
      );

      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveAttribute('href', '/');

      const pdcLink = screen.getByText('Personal Data Center').closest('a');
      expect(pdcLink).toHaveAttribute('href', '/personal-data-center');
    });

    it('renders last item as current page (not a link)', () => {
      render(
        <PageHeader
          title="Employee Details"
          breadcrumbs={[
            { label: 'Personal Data Center', href: '/personal-data-center' },
            { label: 'Employee Details' },
          ]}
        />,
      );

      const breadcrumbTexts = screen.getAllByText('Employee Details');
      const breadcrumbPage = breadcrumbTexts.find(
        (el) => el.closest('a') === null && el.closest('[data-slot="breadcrumb-page"]'),
      );
      expect(breadcrumbPage).toBeTruthy();
    });

    it('renders separators between items', () => {
      render(
        <PageHeader
          title="Details"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Section', href: '/section' },
            { label: 'Details' },
          ]}
        />,
      );

      // Two linked items should produce two separators
      const separators = document.querySelectorAll('[data-slot="breadcrumb-separator"]');
      expect(separators.length).toBe(2);
    });

    it('does not render breadcrumb area when not provided', () => {
      render(<PageHeader title="Companies" />);

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('does not render breadcrumb area when empty array', () => {
      render(<PageHeader title="Companies" breadcrumbs={[]} />);

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('handles single breadcrumb item as current page', () => {
      render(<PageHeader title="Dashboard" breadcrumbs={[{ label: 'Dashboard' }]} />);

      const breadcrumbNav = screen.getByRole('navigation');
      expect(breadcrumbNav).toBeInTheDocument();
    });
  });

  describe('className', () => {
    it('applies additional className', () => {
      const { container } = render(<PageHeader title="Companies" className="mb-6" />);

      expect(container.firstChild).toHaveClass('mb-6');
    });
  });
});
