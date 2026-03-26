import { useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import type { CompanyGroupFormValue } from '../_components/company-group-chooser';

export function useValidateCompanyGroupCode() {
  const utils = trpc.useUtils();

  return useCallback(
    async (code: string): Promise<CompanyGroupFormValue | null> => {
      try {
        const result = await utils.common.companyGroup.list.fetch({
          page: 1,
          limit: 2,
          search: code,
        });

        const exactMatch = result.data.find((item) => item.companyGroupCode === code);

        if (!exactMatch) return null;

        return {
          companyGroupId: exactMatch.companyGroupId,
          companyGroupCode: exactMatch.companyGroupCode ?? '',
          companyGroupName: exactMatch.companyGroupName ?? '',
        };
      } catch {
        return null;
      }
    },
    [utils],
  );
}
