'use client';

import {
  ArrowDownAZ,
  ArrowUpAZ,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { MultipleSelect } from '@/components/custom/multiple-select';
import Pagination from '@/components/custom/pagination';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Asset, AssetSortField } from '@/features/asset/asset.types';
import useGetAssets from '@/features/asset/useGetAssets';
import useGetCategories from '@/features/category/useGetCategories';
import { AssetState, Order } from '@/lib/@types/api';
import { AssetStateOptions } from '@/lib/constants/asset';
import { PAGE_SIZE } from '@/lib/constants/pagination';
import useDebounce from '@/lib/hooks/useDebounce';

import DetailedAssetDialog from '../components/show-detailed-asset-dialog';

const columns = [
  { label: 'Asset Code', key: 'assetCode' },
  { label: 'Asset Name', key: 'name' },
  { label: 'Category', key: 'category' },
  { label: 'State', key: 'state' },
];

export default function AssetList() {
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearchValue = useDebounce(searchValue, 700);
  const [selectedAssetStates, setSelectedAssetStates] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<AssetSortField>('assetCode');
  const [sortOrder, setSortOrder] = useState<Order>(Order.ASC);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

  const { data: assets, refetch: refetchAssets } = useGetAssets({
    page,
    take: PAGE_SIZE,
    search: debouncedSearchValue,
    states: selectedAssetStates,
    categoryIds: selectedCategoryIds,
    sortField,
    sortOrder,
  });

  const { data: categories, refetch: refetchCategories } = useGetCategories();

  useEffect(() => {
    refetchAssets();
    refetchCategories();
  }, [
    page,
    debouncedSearchValue,
    selectedAssetStates,
    selectedCategoryIds,
    sortField,
    sortOrder,
    refetchAssets,
    refetchCategories,
  ]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setPage(1);
  };

  const handleSetSelectedAssetStates = (selectedItems: string[]) => {
    setSelectedAssetStates(selectedItems);
    setPage(1);
  };

  const handleSetSelectedCategoryIds = (selectedItems: string[]) => {
    setSelectedCategoryIds(selectedItems);
    setPage(1);
  };

  const handleSortColumn = (column: AssetSortField) => {
    if (sortField === column) {
      setSortOrder((prevOrder) =>
        prevOrder === Order.ASC ? Order.DESC : Order.ASC,
      );
    } else {
      setSortField(column);
      setSortOrder(Order.ASC);
    }
  };

  const handleOpenDialog = (assetId: number) => {
    setSelectedAssetId(assetId);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 p-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <MultipleSelect
            title="State"
            items={[
              {
                label: AssetStateOptions[AssetState.ASSIGNED],
                value: AssetState.ASSIGNED,
              },
              {
                label: AssetStateOptions[AssetState.AVAILABLE],
                value: AssetState.AVAILABLE,
              },
              {
                label: AssetStateOptions[AssetState.UNAVAILABLE],
                value: AssetState.UNAVAILABLE,
              },
              {
                label: AssetStateOptions[AssetState.WAITING_FOR_RECYCLING],
                value: AssetState.WAITING_FOR_RECYCLING,
              },
              {
                label: AssetStateOptions[AssetState.RECYCLED],
                value: AssetState.RECYCLED,
              },
            ]}
            selectedItems={selectedAssetStates}
            setSelectedItems={(selectedItems: string[]) =>
              handleSetSelectedAssetStates(selectedItems)
            }
          />
        </div>
        <div className="lg:col-span-1">
          <MultipleSelect
            title="Category"
            items={categories?.map((category) => ({
              label: category.name,
              value: category.id.toString(),
            }))}
            selectedItems={selectedCategoryIds}
            setSelectedItems={(selectedItems: string[]) =>
              handleSetSelectedCategoryIds(selectedItems)
            }
          />
        </div>
        <div className="lg:col-span-1">
          <Input
            type="text"
            placeholder="Search by name or asset code"
            className="rounded-md border"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Button variant="default" className="lg:col-span-1">
          Create new asset
        </Button>
      </div>

      <div className="rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      handleSortColumn(column.key as AssetSortField)
                    }
                  >
                    {column.label}
                    {sortField === column.key &&
                      (sortOrder === Order.ASC ? (
                        <ArrowDownAZ className="ml-2 inline size-4" />
                      ) : (
                        <ArrowUpAZ className="ml-2 inline size-4" />
                      ))}
                  </Button>
                </TableHead>
              ))}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets && assets.data.length > 0 ? (
              assets.data.map((row: Asset) => (
                <TableRow
                  key={row.id}
                  onClick={() => handleOpenDialog(row.id)}
                  className="cursor-pointer"
                >
                  <TableCell className="py-2">{row.assetCode}</TableCell>
                  <TableCell className="py-2">{row.name}</TableCell>
                  <TableCell className="py-2">{row.category.name}</TableCell>
                  <TableCell className="py-2">
                    {AssetStateOptions[row.state]}
                  </TableCell>
                  <TableCell className="py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="size-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Pencil className="mr-4 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <Trash2 className="mr-4 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-2 text-center text-gray-400"
                >
                  No assets to display.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        totalPages={assets?.pagination.totalPages || 0}
        currentPage={page}
        onPageChange={handlePageChange}
      />

      {dialogOpen && selectedAssetId && (
        <DetailedAssetDialog
          isOpen={dialogOpen}
          onOpenChange={setDialogOpen}
          assetId={selectedAssetId}
        />
      )}
    </div>
  );
}
