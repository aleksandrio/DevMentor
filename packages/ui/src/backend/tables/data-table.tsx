"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@devmentor/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@devmentor/ui/components/ui/table";
import { EmptyState } from "../feedback/empty-state";
import { ErrorMessage } from "../feedback/error-message";
import { LoadingMessage } from "../feedback/loading-message";

export interface DataTableColumn<Row> {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  className?: string;
}

export interface DataTableRowAction<Row> {
  label: string;
  onSelect: (row: Row) => void;
  isDestructive?: boolean;
}

interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  /** `undefined` while the first load is in progress. */
  rows: Row[] | undefined;
  getRowId: (row: Row) => string;
  /** Error message of the last load; takes precedence over `rows`. */
  error?: string | null;
  onRetry?: () => void;
  emptyState: { title: string; description?: string };
  caption?: string;
  rowActions?: DataTableRowAction<Row>[];
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

/** Column-config list with built-in loading, error, empty states and client-side pagination. */
export function DataTable<Row>({
  columns,
  rows,
  getRowId,
  error,
  onRetry,
  emptyState,
  caption,
  rowActions,
  pageSize = DEFAULT_PAGE_SIZE,
}: DataTableProps<Row>) {
  const [pageIndex, setPageIndex] = useState(0);

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }
  if (!rows) {
    return <LoadingMessage />;
  }
  if (rows.length === 0) {
    return <EmptyState title={emptyState.title} description={emptyState.description} />;
  }

  const pageCount = Math.ceil(rows.length / pageSize);
  // Rows may shrink after a reload; never show a page past the end.
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageRows = rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const hasRowActions = !!rowActions?.length;

  return (
    <div data-slot="data-table" className="flex flex-col gap-3">
      <Table>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} className={column.className}>
                {column.header}
              </TableHead>
            ))}
            {hasRowActions && <TableHead className="text-right">Akcje</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((row) => (
            <TableRow key={getRowId(row)}>
              {columns.map((column) => (
                <TableCell key={column.id} className={column.className}>
                  {column.cell(row)}
                </TableCell>
              ))}
              {hasRowActions && (
                <TableCell className="space-x-1 text-right">
                  {rowActions.map((action) => (
                    <Button
                      key={action.label}
                      size="sm"
                      variant={action.isDestructive ? "destructive" : "outline"}
                      onClick={() => action.onSelect(row)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pageCount > 1 && (
        <nav aria-label="Paginacja" className="flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">
            Strona {currentPage + 1} z {pageCount}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 0}
            onClick={() => setPageIndex(currentPage - 1)}
          >
            Poprzednia
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === pageCount - 1}
            onClick={() => setPageIndex(currentPage + 1)}
          >
            Następna
          </Button>
        </nav>
      )}
    </div>
  );
}
