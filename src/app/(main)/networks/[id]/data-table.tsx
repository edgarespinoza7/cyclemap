"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const currentPage = pageIndex + 1;

  // --- Calculate page numbers to display ---
  const getPageNumbers = (): number[] => {
    const totalPages = pageCount;
    const current = currentPage;
    const maxButtons = 3; // Max number of page buttons to show

    if (totalPages <= maxButtons) {
      // If total pages are 3 or less, show all of them
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // If more than 3 pages
    if (current === 1) {
      // If on the first page, show 1, 2, 3
      return [1, 2, 3];
    } else if (current === totalPages) {
      // If on the last page, show the last 3 pages
      return [totalPages - 2, totalPages - 1, totalPages];
    } else {
      // Otherwise, show previous, current, and next
      return [current - 1, current, current + 1];
    }
  };

  const pageNumbersToShow = getPageNumbers();

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Conditional Pagination Controls */}
      {/* It only show if there are multiple pages */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center space-x-2 py-4">
          <div className="flex items-center space-x-2">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>

            {/* Numbered Pagination Buttons */}
            <div className="flex items-center space-x-1">
              {pageNumbersToShow.map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPage ? "outline" : "ghost"} // Highlight current page
                  size="sm"
                  onClick={() => table.setPageIndex(pageNumber - 1)} // Go to specific page index
                  disabled={pageNumber === currentPage} // Optionally disable clicking the current page
                >
                  {pageNumber}
                </Button>
              ))}
            </div>

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
