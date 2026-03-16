import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { ConfirmDialog } from './confirm-dialog/confirm-dialog';
import { StatusBadge } from './status-badge/status-badge';
import { PageHeader } from './page-header/page-header';
import { Button } from './ui/button';

// ── Meta ──

const meta: Meta = {
  title: 'Shared',
  parameters: { layout: 'padded' },
};

export default meta;

// ── ConfirmDialog ──

export const ConfirmDialogDefault: StoryObj = {
  name: 'ConfirmDialog — Default',
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Confirm</Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Approve Request"
          description="Are you sure you want to approve this request?"
          onConfirm={() => {
            alert('Confirmed!');
            setOpen(false);
          }}
        />
      </>
    );
  },
};

export const ConfirmDialogDestructive: StoryObj = {
  name: 'ConfirmDialog — Destructive',
  render: () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete Record
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Delete Record"
          description="This action cannot be undone. All data will be permanently removed."
          variant="destructive"
          confirmLabel="Yes, delete it"
          cancelLabel="No, keep it"
          loading={loading}
          onConfirm={async () => {
            setLoading(true);
            await new Promise((r) => setTimeout(r, 1500));
            setLoading(false);
            setOpen(false);
            alert('Deleted!');
          }}
        />
      </>
    );
  },
};

// ── StatusBadge ──

export const StatusBadgeVariants: StoryObj = {
  name: 'StatusBadge — All Statuses',
  render: () => {
    const statuses = [
      'DRAFT',
      'OPEN',
      'APPROVED',
      'REJECTED',
      'CANCELLED',
      'SYNCHRONIZED',
      'IN_PROGRESS',
    ];

    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      APPROVED: 'default',
      REJECTED: 'destructive',
      CANCELLED: 'secondary',
      OPEN: 'outline',
    };

    return (
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">Without variant map (all secondary):</p>
          <div className="flex flex-wrap gap-2">
            {statuses.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">With variant map:</p>
          <div className="flex flex-wrap gap-2">
            {statuses.map((s) => (
              <StatusBadge key={s} status={s} variantMap={variantMap} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">With label override:</p>
          <StatusBadge status="SYNC" label="Synchronized" />
        </div>
      </div>
    );
  },
};

// ── PageHeader ──

export const PageHeaderSimple: StoryObj = {
  name: 'PageHeader — Simple (No Breadcrumb)',
  render: () => <PageHeader title="Termination Reason" />,
};

export const PageHeaderWithDescription: StoryObj = {
  name: 'PageHeader — With Description',
  render: () => (
    <PageHeader title="Company List" description="Manage company records across all subsidiaries" />
  ),
};

export const PageHeaderWithBreadcrumb: StoryObj = {
  name: 'PageHeader — With Breadcrumb',
  render: () => (
    <PageHeader
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Personal Data Center', href: '/personal-data-center' },
        { label: 'Employee Details' },
      ]}
      title="Employee Details"
      description="View and manage employee information"
    />
  ),
};
