import { trpc } from '@/lib/trpc';

export interface CompanyGroupValue {
  id: number;
  code: string;
  name: string;
}

export function useValidateCompanyGroupCode() {
  const utils = trpc.useUtils();

  return async (text: string): Promise<CompanyGroupValue | null> => {
    try {
      const result = await utils.common.companyGroup.list.fetch({
        page: 1,
        limit: 2,
        search: text,
      });

      const exactMatch = result.data.find((item) => item.companyGroupCode === text);
      if (!exactMatch) return null;

      return {
        id: exactMatch.companyGroupId,
        code: exactMatch.companyGroupCode ?? '',
        name: exactMatch.companyGroupName ?? '',
      };
    } catch {
      return null;
    }
  };
}
