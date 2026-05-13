<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace App\Foundation\Repository;

use Hyperf\Context\ApplicationContext;
use Hyperf\Database\Model\Builder;
use Hyperf\Database\Query\Builder as QueryBuilder;
use Hyperf\DbConnection\Model\Model;
use RuntimeException;
use TrueAdmin\Kernel\Crud\CrudOperator;
use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Crud\CrudQueryApplier;
use TrueAdmin\Kernel\Crud\CrudQueryApplierOptions;
use TrueAdmin\Kernel\Crud\CrudSortRule;
use TrueAdmin\Kernel\DataPermission\DataPolicyManager;
use TrueAdmin\Kernel\DataPermission\DataPolicyTarget;
use TrueAdmin\Kernel\Pagination\PageResult;

/**
 * @template TModel of Model
 */
abstract class AbstractRepository
{
    /**
     * @var null|class-string<TModel>
     */
    protected ?string $modelClass = null;

    /**
     * @var list<string>
     */
    protected array $keywordFields = [];

    /**
     * @var array<string, bool|list<string>|string>
     */
    protected array $filterable = [];

    /**
     * @var '*'|list<string>
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

    /**
     * @return Builder<TModel>
     */
    protected function query(): Builder
    {
        $modelClass = $this->modelClass();

        return $modelClass::query();
    }

    /**
     * @return null|TModel
     */
    protected function findModelById(int|string $id): ?Model
    {
        return $this->firstModel($this->query()->where('id', $id));
    }

    protected function existsModelById(int|string $id): bool
    {
        return $this->query()->where('id', $id)->exists();
    }

    /**
     * @param array<string, mixed> $data
     * @return TModel
     */
    protected function createModel(array $data): Model
    {
        $model = $this->query()->create($data);
        if (! $model instanceof Model) {
            throw new RuntimeException('Expected model create result to be a ' . Model::class . ' instance.');
        }

        return $model;
    }

    /**
     * @param TModel $model
     * @param array<string, mixed> $data
     * @return TModel
     */
    protected function updateModel(Model $model, array $data): Model
    {
        $model->fill($data);
        $model->save();
        $model->refresh();

        return $model;
    }

    /**
     * @param TModel $model
     */
    protected function deleteModel(Model $model): void
    {
        $model->delete();
    }

    /**
     * @template TFound of Model
     * @param Builder<TFound> $query
     * @return null|TFound
     */
    protected function firstModel(Builder $query): ?Model
    {
        $model = $query->first();
        if ($model === null) {
            return null;
        }
        if (! $model instanceof Model) {
            throw new RuntimeException('Expected query result to be a ' . Model::class . ' instance.');
        }

        return $model;
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
     * @param array<string, mixed>|DataPolicyTarget $target
     */
    protected function applyDataPolicy(Builder|QueryBuilder $query, string $resource, array|DataPolicyTarget $target = []): void
    {
        $this->dataPolicyManager()->apply($query, $resource, $target);
    }

    /**
     * @param array<string, mixed>|DataPolicyTarget $target
     */
    protected function dataPolicyAllows(Builder|QueryBuilder $query, string $resource, array|DataPolicyTarget $target = []): bool
    {
        return $this->dataPolicyManager()->allows($query, $resource, $target);
    }

    /**
     * @param array<string, mixed>|DataPolicyTarget $target
     */
    protected function assertDataPolicyAllows(Builder|QueryBuilder $query, string $resource, array|DataPolicyTarget $target = []): void
    {
        $this->dataPolicyManager()->assertAllows($query, $resource, $target);
    }

    /**
     * @param list<int|string> $ids
     * @param array<string, mixed>|DataPolicyTarget $target
     */
    protected function assertDataPolicyAllowsAll(Builder|QueryBuilder $query, string $resource, array $ids, string $idColumn = 'id', array|DataPolicyTarget $target = []): void
    {
        $this->dataPolicyManager()->assertAllowsAll($query, $resource, $ids, $idColumn, $target);
    }

    protected function dataPolicyManager(): DataPolicyManager
    {
        $manager = ApplicationContext::getContainer()->get(DataPolicyManager::class);
        if (! $manager instanceof DataPolicyManager) {
            throw new RuntimeException('Expected container service ' . DataPolicyManager::class . '.');
        }

        return $manager;
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
        $applier = ApplicationContext::getContainer()->get(CrudQueryApplier::class);
        if (! $applier instanceof CrudQueryApplier) {
            throw new RuntimeException('Expected container service ' . CrudQueryApplier::class . '.');
        }

        return $applier;
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
     * @return array<string, bool|list<string>|string>
     */
    protected function filterable(): array
    {
        return $this->filterable;
    }

    /**
     * @return '*'|list<string>
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

    /**
     * @return class-string<TModel>
     */
    protected function modelClass(): string
    {
        if ($this->modelClass === null || $this->modelClass === '') {
            throw new RuntimeException(static::class . ' must define $modelClass before using model helpers.');
        }
        if (! is_subclass_of($this->modelClass, Model::class)) {
            throw new RuntimeException(static::class . ' $modelClass must extend ' . Model::class . '.');
        }

        return $this->modelClass;
    }
}
