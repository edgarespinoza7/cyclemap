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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useState } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (rowData: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick, // Optional function to call when a row is clicked
}: DataTableProps<TData, TValue>) {
  // State for managing how the table is sorted
  const [sorting, setSorting] = useState<SortingState>([]);
  // Initialize the table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      // Current state of the table
      sorting, // Tells the table how it's currently sorted
    },
    onSortingChange: setSorting, // When sorting changes, update our 'sorting' state
    getCoreRowModel: getCoreRowModel(), // Essential for basic table functionality
    getPaginationRowModel: getPaginationRowModel(), // Enables pagination features
    getSortedRowModel: getSortedRowModel(), // Enables sorting features
    initialState: {
      // Initial settings for the table
      pagination: {
        pageSize: 12, // Show 12 rows per page by default
      },
    },
  });

  // Get pagination information from the table instance
  const { pageIndex } = table.getState().pagination; // Current page index (0-based)
  const pageCount = table.getPageCount(); // Total number of pages
  const currentPage = pageIndex + 1; // Current page number (1-based, for display)

  // Helper to create a smart pagination range (1, ..., 5, 6, 7, ..., 10)
  const getPaginationRange = (
    currentPage: number,
    totalPages: number,
    siblingCount = 1 // How many page numbers to show on each side of the current page
  ): (number | string)[] => {
    // Returns an array of numbers or "..." strings
    const totalPageNumbers = siblingCount + 5; // Total items in pagination UI (1, prev, current, next, last + siblings)

    // Case 1: If there aren't many pages, just show all of them
    if (totalPageNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Calculate the start and end of the "sibling" page numbers around the current page
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    // Determine if we need to show "..." (dots) on the left or right
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // Case 2: No dots on the left, but dots on the right
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "...", totalPages];
    }

    // Case 3: Dots on the left, but no dots on the right
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [firstPageIndex, "...", ...rightRange];
    }

    // Case 4: Dots on both left and right
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
    }

    // Default case (should not happen with above logic, but for safety)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  };

  // Generate the actual pagination range to be used in the UI
  const paginationRange = getPaginationRange(currentPage, pageCount);

  return (
    <div>
      <div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-white uppercase md:text-base font-semibold tracking-wider"
                    >
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
                  onClick={() => onRowClick?.(row.original)} // Call handler with original row data
                  className={
                    onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        // Center specific columns
                        ["free_bikes", "empty_slots"].includes(cell.column.id)
                          ? "text-center font-semibold"
                          : // Limit width and truncate the 'name' column
                          cell.column.id === "name" || "row.extra.address"
                          ? "max-w-[200px] truncate text-base"
                          : ""
                      }
                    >
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
                <TableCell colSpan={columns.length}>No results.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Conditional Pagination Controls */}
      {/* Only shows if there are multiple pages */}
      {pageCount > 1 && (
        <div className="py-4 flex justify-center pt-4 sticky bottom-0 bg-primary">
          <Pagination>
            <PaginationContent>
              {/* Previous Page Button */}
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => table.previousPage()}
                  aria-disabled={!table.getCanPreviousPage()}
                  className={
                    !table.getCanPreviousPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {/* Page Numbers and dots */}
              {paginationRange.map((pageNumber, index) => (
                <PaginationItem key={index}>
                  {typeof pageNumber === "string" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => table.setPageIndex(pageNumber - 1)} // pageIndex is 0-based
                      isActive={currentPage === pageNumber}
                      aria-current={
                        currentPage === pageNumber ? "page" : undefined
                      }
                      className="cursor-pointer font-semibold active:text-[#33347C]"
                    >
                      {pageNumber}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              {/* Next Page Button */}
              <PaginationItem>
                <PaginationNext
                  onClick={() => table.nextPage()}
                  aria-disabled={!table.getCanNextPage()}
                  className={
                    !table.getCanNextPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
