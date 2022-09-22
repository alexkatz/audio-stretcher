import queryString, { ParsedQuery } from 'query-string';
import create from 'zustand';

type ParsedQueryStore = {
  parsedQuery: ParsedQuery;
  updateQuery(pathname: string): void;
};

const useParsedQueryStore = create<ParsedQueryStore>((set) => ({
  parsedQuery: {},
  updateQuery(pathname: string) {
    const index = pathname.indexOf('?');
    const search = pathname.substring(index);
    const parsed = queryString.parse(search);
    set({ parsedQuery: parsed });
  },
}));

export const useParsedQuery = <T = ParsedQuery>() => useParsedQueryStore((state) => state.parsedQuery as T);
export const useUpdateParsedQuery = () => useParsedQueryStore((state) => state.updateQuery);
