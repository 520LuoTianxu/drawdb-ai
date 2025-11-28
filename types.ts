
export interface Column {
  id: string;
  name: string;
  type: string;
  isPk: boolean;
  isFk: boolean;
  comment?: string;
  nullable?: boolean;
  color?: string; // Hex color for the column row background
}

export interface TableData {
  label: string; // Table Name
  comment?: string;
  columns: Column[];
  isExpanded?: boolean;
  headerColor?: string; // Hex color for the table header background
  dimmed?: boolean; // For highlighting effect
}

export enum Cardinality {
  ONE_TO_ONE = '1:1',
  ONE_TO_MANY = '1:N',
  MANY_TO_ONE = 'N:1',
  MANY_TO_MANY = 'N:N'
}

export interface EditorState {
  isOpen: boolean;
  tableId: string | null;
}

export interface ModalState {
  type: 'IMPORT' | 'EXPORT_SQL' | null;
  content?: string;
}

// History stack type
export interface HistoryState {
  nodes: any[];
  edges: any[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  nodes: any[]; // ReactFlow Nodes
  edges: any[]; // ReactFlow Edges
  version: number;
}
