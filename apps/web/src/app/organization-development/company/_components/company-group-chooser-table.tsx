'use client';

import { useState } from 'react';
import type { ChooserContext } from '@/components/chooser';
import {
  Button,
  Checkbox,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { trpc } from '@/lib/trpc';

export interface CompanyGroup {
  companyGroupId: number;
  companyGroupCode: string | null;
  companyGroupName: string | null;
}

const PAGE_SIZE = 10;

export function CompanyGroupChooserTable({
  isSelected,
  toggleRow,
  enabled = true,
}: Pick<ChooserContext<CompanyGroup>, 'isSelected' | 'toggleRow'> & {
  enabled?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query = trpc.common.companyGroup.list.useQuery(
    { page, limit: PAGE_SIZE, search },
    { enabled },
  );

  const data = query.data?.data ?? [];
  const totalPages = Math.ceil((query.data?.count ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search company groups..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      <div className="max-h-64 overflow-auto rounded border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sub">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sub">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={row.companyGroupId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('[data-slot="checkbox"]')) return;
                    toggleRow(row);
                  }}
                >
                  <TableCell>
                    <Checkbox checked={isSelected(row)} onCheckedChange={() => toggleRow(row)} />
                  </TableCell>
                  <TableCell className="font-mono">{row.companyGroupCode}</TableCell>
                  <TableCell>{row.companyGroupName}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-sub">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
