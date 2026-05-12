<?php

declare(strict_types=1);

namespace App\Foundation\Repository;

use App\Foundation\DataPermission\DataPolicyManager;
use Hyperf\Context\ApplicationContext;
use Hyperf\Database\Model\Builder;
use Hyperf\DbConnection\Db;
use Hyperf\DbConnection\Model\Model;
use RuntimeException;
use TrueAdmin\Kernel\Crud\CrudOperator;
use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Crud\CrudQueryApplier;
use TrueAdmin\Kernel\Crud\CrudQueryApplierOptions;
use TrueAdmin\Kernel\Crud\CrudSortRule;
use TrueAdmin\Kernel\Pagination\PageResult;

abstract class AbstractRepository
{
    protected ?string $modelClass = null;

    /**
     * @var list<string>
     */
    protected array $keywordFields = [];

    /**
     * @var array<string, bool|string|list<string>>
     */
    protected array $filterable = [];

    /**
     * @var list<string>|'*'
     */
    protected array|string $defaultFilterOps = ['eq', 'in'];

    /**
     * @var array<string, string>
     */
    protected array $filterColumns = [];

    /**
     * @var list<string>
     */
    protected array $sortable = [];

    /**
     * @var array<string, string>
     */
    protected array $sortColumns = [];

    /**
     * @var array<string, string>
     */
    protected array $defaultSort = ['id' => 'desc'];

    protected function query(): Builder
    {
        $modelClass = $this->modelClass();

        return $modelClass::query();
    }

    protected function findModelById(int|string $id): ?Model
    {
        return $this->query()->where('id', $id)->first();
    }

    protected function existsModelById(int|string $id): bool
    {
        return $this->query()->where('id', $id)->exists();
    }

    protected function createModel(array $data): Model
    {
        return $this->query()->create($data);
    }

    protected function updateModel(Model $model, array $data): Model
    {
        $model->fill($data);
        $model->save();

        return $model->refresh();
    }

    protected function deleteModel(Model $model): void
    {
        $model->delete();
    }

    /**
     * @param list<int|string> $ids
     * @return list<int>
     */
    protected function existingModelIds(array $ids, string $field = 'id'): array
    {
        return $this->query()
            ->whereIn($field, array_values(array_unique($ids)))
            ->pluck($field)
            ->map(static fn ($id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @param list<int> $relatedIds
     */
    protected function syncPivot(string $table, string $ownerColumn, int $ownerId, string $relatedColumn, array $relatedIds, ?callable $extra = null): void
    {
        Db::table($table)->where($ownerColumn, $ownerId)->delete();

        foreach (array_values(array_unique($relatedIds)) as $relatedId) {
            $row = [$ownerColumn => $ownerId, $relatedColumn => $relatedId];
            if ($extra !== null) {
                $row = [...$row, ...$extra($relatedId)];
            }
            Db::table($table)->insert($row);
        }
    }

    /**
     * @return list<int>
     */
    protected function pivotIds(string $table, string $ownerColumn, int $ownerId, string $relatedColumn): array
    {
        return Db::table($table)
            ->where($ownerColumn, $ownerId)
            ->pluck($relatedColumn)
            ->map(static fn ($id): int => (int) $id)
            ->values()
            ->all();
    }

    protected function pageQuery(Builder $query, CrudQuery $adminQuery, callable $mapper): PageResult
    {
        $this->applyCrudQuery($query, $adminQuery);

        $total = (int) (clone $query)->count();
        $items = $query
            ->forPage($adminQuery->page, $adminQuery->pageSize)
            ->get()
            ->map($mapper)
            ->all();

        return new PageResult($items, $total, $adminQuery->page, $adminQuery->pageSize);
    }

    protected function listQuery(Builder $query, CrudQuery $adminQuery, callable $mapper): array
    {
        $this->applyCrudQuery($query, $adminQuery);

        return $query->get()->map($mapper)->all();
    }

    /**
     * @param array<string, mixed>|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target
     */
    protected function applyDataPolicy(Builder $query, string $resource, array|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target = []): void
    {
        $this->dataPolicyManager()->apply($query, $resource, $target);
    }

    /**
     * @param array<string, mixed>|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target
     */
    protected function dataPolicyAllows(Builder $query, string $resource, array|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target = []): bool
    {
        return $this->dataPolicyManager()->allows($query, $resource, $target);
    }

    /**
     * @param array<string, mixed>|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target
     */
    protected function assertDataPolicyAllows(Builder $query, string $resource, array|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target = []): void
    {
        $this->dataPolicyManager()->assertAllows($query, $resource, $target);
    }

    /**
     * @param list<int|string> $ids
     * @param array<string, mixed>|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target
     */
    protected function assertDataPolicyAllowsAll(Builder $query, string $resource, array $ids, string $idColumn = 'id', array|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target = []): void
    {
        $this->dataPolicyManager()->assertAllowsAll($query, $resource, $ids, $idColumn, $target);
    }

    protected function dataPolicyManager(): DataPolicyManager
    {
        return ApplicationContext::getContainer()->get(DataPolicyManager::class);
    }

    final protected function applyCrudQuery(Builder $query, CrudQuery $adminQuery): void
    {
        $this->beforeApplyCrudQuery($query, $adminQuery);
        $this->applyKeyword($query, $adminQuery);
        $this->applyFilters($query, $adminQuery);
        $this->applyParams($query, $adminQuery);
        $this->applySort($query, $adminQuery);
        $this->afterApplyCrudQuery($query, $adminQuery);
    }

    protected function beforeApplyCrudQuery(Builder $query, CrudQuery $adminQuery): void
    {
    }

    protected function afterApplyCrudQuery(Builder $query, CrudQuery $adminQuery): void
    {
    }

    protected function applyParams(Builder $query, CrudQuery $adminQuery): void
    {
    }

    protected function applyKeyword(Builder $query, CrudQuery $adminQuery): void
    {
        $this->crudQueryApplier()->applyKeyword($query, $adminQuery, $this->crudQueryApplierOptions());
    }

    protected function applyFilters(Builder $query, CrudQuery $adminQuery): void
    {
        $this->crudQueryApplier()->applyFilters(
            $query,
            $adminQuery,
            $this->crudQueryApplierOptions(),
            $this->applyFilterCondition(...),
            $this->filterColumn(...),
        );
    }

    protected function applySort(Builder $query, CrudQuery $adminQuery): void
    {
        $this->crudQueryApplier()->applySort(
            $query,
            $adminQuery,
            $this->crudQueryApplierOptions(),
            $this->applySortRule(...),
            $this->applyDefaultSortRule(...),
            $this->assertSortable(...),
        );
    }

    protected function applyFilterCondition(Builder $query, string $field, CrudOperator $operator, mixed $value, string $column): void
    {
        $this->crudQueryApplier()->applyFilterCondition($query, $field, $operator, $value, $column);
    }

    protected function applySortRule(Builder $query, CrudSortRule $sort, string $column): void
    {
        $this->crudQueryApplier()->applySortRule($query, $sort, $column);
    }

    protected function applyDefaultSortRule(Builder $query, string $field, string $direction): void
    {
        $query->orderBy(
            $this->sortColumn($field),
            strtolower($direction) === 'desc' ? 'desc' : 'asc',
        );
    }

    protected function assertFilterable(string $field, CrudOperator $operator): void
    {
        $this->crudQueryApplier()->assertFilterable($field, $operator, $this->crudQueryApplierOptions());
    }

    protected function assertSortable(CrudSortRule $sort): string
    {
        $this->crudQueryApplier()->assertSortable($sort, $this->crudQueryApplierOptions());

        return $this->sortColumn($sort->field);
    }

    protected function crudQueryApplier(): CrudQueryApplier
    {
        return ApplicationContext::getContainer()->get(CrudQueryApplier::class);
    }

    protected function crudQueryApplierOptions(): CrudQueryApplierOptions
    {
        return new CrudQueryApplierOptions(
            keywordFields: $this->keywordFields(),
            filterable: $this->filterable(),
            defaultFilterOps: $this->defaultFilterOps(),
            filterColumns: $this->filterColumns(),
            sortable: $this->sortable(),
            sortColumns: $this->sortColumns(),
            defaultSort: $this->defaultSort(),
        );
    }

    /**
     * @return list<string>
     */
    protected function keywordFields(): array
    {
        return $this->keywordFields;
    }

    /**
     * @return array<string, bool|string|list<string>>
     */
    protected function filterable(): array
    {
        return $this->filterable;
    }

    /**
     * @return list<string>|'*'
     */
    protected function defaultFilterOps(): array|string
    {
        return $this->defaultFilterOps;
    }

    protected function filterColumn(string $field): string
    {
        return $this->crudQueryApplier()->filterColumn($field, $this->crudQueryApplierOptions());
    }

    /**
     * @return array<string, string>
     */
    protected function filterColumns(): array
    {
        return $this->filterColumns;
    }

    /**
     * @return list<string>
     */
    protected function sortable(): array
    {
        return $this->sortable;
    }

    protected function sortColumn(string $field): string
    {
        return $this->crudQueryApplier()->sortColumn($field, $this->crudQueryApplierOptions());
    }

    /**
     * @return array<string, string>
     */
    protected function sortColumns(): array
    {
        return $this->sortColumns;
    }

    /**
     * @return array<string, string>
     */
    protected function defaultSort(): array
    {
        return $this->defaultSort;
    }

    protected function modelClass(): string
    {
        if ($this->modelClass === null || $this->modelClass === '') {
            throw new RuntimeException(static::class . ' must define $modelClass before using model helpers.');
        }

        return $this->modelClass;
    }
}
