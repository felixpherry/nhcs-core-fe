import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  describe('label formatting', () => {
    it('capitalizes single-word status', () => {
      render(<StatusBadge status="APPROVED" />);

      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('converts underscores to spaces and capitalizes each word', () => {
      render(<StatusBadge status="IN_PROGRESS" />);

      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('handles lowercase status', () => {
      render(<StatusBadge status="draft" />);

      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('handles mixed case status', () => {
      render(<StatusBadge status="Cancelled" />);

      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('uses label override when provided', () => {
      render(<StatusBadge status="SYNC" label="Synchronized" />);

      expect(screen.getByText('Synchronized')).toBeInTheDocument();
      expect(screen.queryByText('Sync')).not.toBeInTheDocument();
    });
  });

  describe('variant', () => {
    it('uses secondary variant by default', () => {
      render(<StatusBadge status="DRAFT" />);

      const badge = screen.getByText('Draft');
      expect(badge).toHaveAttribute('data-slot', 'badge');
    });

    it('uses variant prop when provided', () => {
      render(<StatusBadge status="APPROVED" variant="default" />);

      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('resolves variant from variantMap', () => {
      const variantMap = {
        APPROVED: 'default' as const,
        REJECTED: 'destructive' as const,
      };

      render(<StatusBadge status="REJECTED" variantMap={variantMap} />);

      const badge = screen.getByText('Rejected');
      expect(badge).toHaveClass('bg-destructive/10');
    });

    it('variantMap overrides variant prop', () => {
      render(
        <StatusBadge
          status="APPROVED"
          variant="destructive"
          variantMap={{ APPROVED: 'default' }}
        />,
      );

      const badge = screen.getByText('Approved');
      expect(badge).not.toHaveClass('bg-destructive/10');
    });

    it('falls back to variant prop when status not in variantMap', () => {
      render(
        <StatusBadge status="UNKNOWN" variant="outline" variantMap={{ APPROVED: 'default' }} />,
      );

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('className', () => {
    it('passes additional className to Badge', () => {
      render(<StatusBadge status="DRAFT" className="ml-2" />);

      const badge = screen.getByText('Draft');
      expect(badge).toHaveClass('ml-2');
    });
  });
});
