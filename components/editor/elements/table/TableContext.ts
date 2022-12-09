import { createContext } from 'react';
import { Table } from 'types/slate';

interface Props {
  table: Table | null;
}

export const TableContext = createContext<Props>({ table: null });
