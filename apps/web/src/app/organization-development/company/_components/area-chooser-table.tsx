'use client';

import { useState } from 'react';
import type { ChooserContext } from '@/components/chooser';
import {
  Button,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { trpc } from '@/lib/trpc';

export interface Area {
  areaId: number;
  stateId: string | null;
  stateName: string | null;
  cityId: string | null;
  cityName: string | null;
  districtId: string | null;
  districtName: string | null;
  subDistrictId: string | null;
  subDistrictName: string | null;
  zipCode: string | null;
}

type AreaSearchBy = 'state' | 'city' | 'district' | 'subdistrict';

const PAGE_SIZE = 10;

export function AreaChooserTable({
  isSelected,
  toggleRow,
  enabled = true,
}: Pick<ChooserContext<Area>, 'isSelected' | 'toggleRow'> & {
  enabled?: boolean;
}) {
  const [searchBy, setSearchBy] = useState<AreaSearchBy>('state');
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);

  const query = trpc.common.area.list.useQuery(
    { page, limit: PAGE_SIZE, searchBy, value: searchValue },
    { enabled },
  );

  const data = query.data?.data ?? [];
  const totalPages = Math.ceil((query.data?.count ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select
          value={searchBy}
          onValueChange={(v) => {
            setSearchBy(v as AreaSearchBy);
            setSearchValue('');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="state">State</SelectItem>
            <SelectItem value="city">City</SelectItem>
            <SelectItem value="district">District</SelectItem>
            <SelectItem value="subdistrict">Sub District</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setPage(1);
          }}
          className="flex-1"
        />
      </div>

      <div className="max-h-64 overflow-auto rounded border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>State</TableHead>
              <TableHead>City</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Sub District</TableHead>
              <TableHead>Zip Code</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sub">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sub">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={row.areaId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('[data-slot="checkbox"]')) return;
                    toggleRow(row);
                  }}
                >
                  <TableCell>
                    <Checkbox checked={isSelected(row)} onCheckedChange={() => toggleRow(row)} />
                  </TableCell>
                  <TableCell>{row.stateName}</TableCell>
                  <TableCell>{row.cityName}</TableCell>
                  <TableCell>{row.districtName}</TableCell>
                  <TableCell>{row.subDistrictName}</TableCell>
                  <TableCell>{row.zipCode}</TableCell>
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
