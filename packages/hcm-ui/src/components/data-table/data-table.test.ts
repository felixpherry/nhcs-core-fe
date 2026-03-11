import { describe, it, expect } from 'vitest';
import { createColumns } from './column-types';
import { buildSortMapping, sortingToOrderBys, type SortingState } from './sort-utils';

interface Company {
  companyId: number;
  companyCode: string;
  companyName: string;
  companyGroupId: number;
  companyGroupName: string;
  isActive: 'T' | 'F';
}

describe('createColumns', () => {
  it('creates columns with defaults', () => {
    const columns = createColumns<Company>([
      { id: 'code', accessorKey: 'companyCode', header: 'Code' },
      { id: 'name', accessorKey: 'companyName', header: 'Name' },
    ]);

    expect(columns).toHaveLength(2);
    expect(columns[0]!.visible).toBe(true);
    expect(columns[0]!.sortKey).toBe('companyCode');
  });

  it('preserves explicit visible=false', () => {
    const columns = createColumns<Company>([
      { id: 'code', accessorKey: 'companyCode', header: 'Code', visible: false },
    ]);

    expect(columns[0]!.visible).toBe(false);
  });

  it('uses explicit sortKey over accessorKey', () => {
    const columns = createColumns<Company>([
      {
        id: 'group',
        accessorKey: 'companyGroupName',
        header: 'Group',
        sortable: true,
        sortKey: 'companyGroupId',
      },
    ]);

    expect(columns[0]!.sortKey).toBe('companyGroupId');
  });

  it('supports accessorFn with explicit id', () => {
    const columns = createColumns<Company>([
      {
        id: 'fullName',
        accessorFn: (row) => `${row.companyCode} - ${row.companyName}`,
        header: 'Full Name',
      },
    ]);

    expect(columns[0]!.id).toBe('fullName');
  });

  it('throws when accessorFn is used without id', () => {
    expect(() =>
      createColumns<Company>([
        {
          id: '',
          accessorFn: (row) => row.companyCode,
          header: 'Code',
        },
      ]),
    ).toThrow();
  });
});

describe('buildSortMapping', () => {
  it('builds mapping from sortable columns', () => {
    const columns = createColumns<Company>([
      { id: 'code', accessorKey: 'companyCode', header: 'Code', sortable: true },
      { id: 'name', accessorKey: 'companyName', header: 'Name', sortable: true },
      { id: 'status', accessorKey: 'isActive', header: 'Status' }, // not sortable
    ]);

    const mapping = buildSortMapping(columns);

    expect(mapping).toEqual({
      code: 'companyCode',
      name: 'companyName',
    });
    expect(mapping['status']).toBeUndefined();
  });

  it('uses sortKey when provided', () => {
    const columns = createColumns<Company>([
      {
        id: 'group',
        accessorKey: 'companyGroupName',
        header: 'Group',
        sortable: true,
        sortKey: 'companyGroupId',
      },
    ]);

    const mapping = buildSortMapping(columns);
    expect(mapping['group']).toBe('companyGroupId');
  });
});

describe('sortingToOrderBys', () => {
  const mapping = {
    code: 'companyCode',
    name: 'companyName',
    group: 'companyGroupId',
  };

  it('converts single sort ascending', () => {
    const sorting: SortingState[] = [{ id: 'code', desc: false }];
    const orderBys = sortingToOrderBys(sorting, mapping);

    expect(orderBys).toEqual([{ item1: 'companyCode', item2: true }]);
  });

  it('converts single sort descending', () => {
    const sorting: SortingState[] = [{ id: 'code', desc: true }];
    const orderBys = sortingToOrderBys(sorting, mapping);

    expect(orderBys).toEqual([{ item1: 'companyCode', item2: false }]);
  });

  it('converts multi sort', () => {
    const sorting: SortingState[] = [
      { id: 'name', desc: false },
      { id: 'group', desc: true },
    ];
    const orderBys = sortingToOrderBys(sorting, mapping);

    expect(orderBys).toEqual([
      { item1: 'companyName', item2: true },
      { item1: 'companyGroupId', item2: false },
    ]);
  });

  it('skips columns not in mapping', () => {
    const sorting: SortingState[] = [
      { id: 'code', desc: false },
      { id: 'unknown', desc: false },
    ];
    const orderBys = sortingToOrderBys(sorting, mapping);

    expect(orderBys).toEqual([{ item1: 'companyCode', item2: true }]);
  });

  it('returns empty array for no sorting', () => {
    const orderBys = sortingToOrderBys([], mapping);
    expect(orderBys).toEqual([]);
  });
});
