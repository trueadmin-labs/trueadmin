<?php

declare(strict_types=1);

namespace App\Foundation\Repository;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Foundation\DataPermission\DataPolicyManager;
use Hyperf\Context\ApplicationContext;
use Hyperf\DbConnection\Db;
use Hyperf\DbConnection\Model\Model;
use RuntimeException;

abstract class AbstractRepository
{
    protected ?string $modelClass = null;

    /**
     * @var list<string>
     */
    protected array $keywordFields = [];

    /**
     * @var array<string, bool|list<string>>
     */
    protected array $filterable = [];

    /**
     * @var list<string>
     */
    protected array $sortable = [];

    /**
     * @var array<string, string>
     */
    protected array $defaultSort = ['id' => 'desc'];

    protected function query(): mixed
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

    protected function pageQuery(mixed $query, AdminQuery $adminQuery, callable $mapper): PageResult
    {
        $this->handleSearch($query, $adminQuery);

        $total = (int) (clone $query)->count();
        $items = $query
            ->forPage($adminQuery->page, $adminQuery->pageSize)
            ->get()
            ->map($mapper)
            ->all();

        return new PageResult($items, $total, $adminQuery->page, $adminQuery->pageSize);
    }

    protected function listQuery(mixed $query, AdminQuery $adminQuery, callable $mapper): array
    {
        $this->handleSearch($query, $adminQuery);

        return $query->get()->map($mapper)->all();
    }


    /**
     * @param array<string, mixed>|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target
     */
    protected function applyDataPolicy(mixed $query, string $resource, array|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target = []): void
    {
        $this->dataPolicyManager()->apply($query, $resource, $target);
    }

    /**
     * @param array<string, mixed>|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target
     */
    protected function dataPolicyAllows(mixed $query, string $resource, array|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target = []): bool
    {
        return $this->dataPolicyManager()->allows($query, $resource, $target);
    }

    /**
     * @param array<string, mixed>|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target
     */
    protected function assertDataPolicyAllows(mixed $query, string $resource, array|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target = []): void
    {
        $this->dataPolicyManager()->assertAllows($query, $resource, $target);
    }

    /**
     * @param list<int|string> $ids
     * @param array<string, mixed>|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target
     */
    protected function assertDataPolicyAllowsAll(mixed $query, string $resource, array $ids, string $idColumn = 'id', array|\TrueAdmin\Kernel\DataPermission\DataPolicyTarget $target = []): void
    {
        $this->dataPolicyManager()->assertAllowsAll($query, $resource, $ids, $idColumn, $target);
    }

    private function dataPolicyManager(): DataPolicyManager
    {
        return ApplicationContext::getContainer()->get(DataPolicyManager::class);
    }

    protected function handleSearch(mixed $query, AdminQuery $adminQuery): void
    {
        $this->applyKeyword($query, $adminQuery);
        $this->applyFilters($query, $adminQuery);
        $this->applySort($query, $adminQuery);
    }

    protected function applyKeyword(mixed $query, AdminQuery $adminQuery): void
    {
        if ($adminQuery->keyword === '' || $this->keywordFields === []) {
            return;
        }

        $keyword = '%' . $adminQuery->keyword . '%';
        $fields = $this->keywordFields;
        $query->where(static function ($query) use ($fields, $keyword): void {
            foreach ($fields as $index => $field) {
                $method = $index === 0 ? 'where' : 'orWhere';
                $query->{$method}($field, 'like', $keyword);
            }
        });
    }

    protected function applyFilters(mixed $query, AdminQuery $adminQuery): void
    {
        foreach ($adminQuery->filters as $field => $value) {
            if (! is_string($field)) {
                continue;
            }

            if (! $this->isFilterable($field, $adminQuery->operator($field))) {
                continue;
            }

            $operator = $adminQuery->operator($field);
            if ($operator === 'like') {
                $query->where($field, 'like', '%' . (string) $value . '%');
                continue;
            }
            if ($operator === 'in') {
                $values = is_array($value) ? $value : explode(',', (string) $value);
                $values = array_values(array_filter($values, static fn (mixed $item): bool => $item !== '' && $item !== null));
                if ($values !== []) {
                    $query->whereIn($field, $values);
                }
                continue;
            }
            if ($operator === 'between') {
                $values = is_array($value) ? array_values($value) : explode(',', (string) $value, 2);
                if (count($values) >= 2 && $values[0] !== '' && $values[1] !== '') {
                    $query->whereBetween($field, [$values[0], $values[1]]);
                }
                continue;
            }

            $query->where($field, $operator, $value);
        }
    }

    protected function applySort(mixed $query, AdminQuery $adminQuery): void
    {
        if ($adminQuery->sort !== '' && in_array($adminQuery->sort, $this->sortable, true)) {
            $query->orderBy($adminQuery->sort, $adminQuery->order === 'desc' ? 'desc' : 'asc');
            return;
        }

        foreach ($this->defaultSort as $field => $direction) {
            $query->orderBy($field, strtolower($direction) === 'desc' ? 'desc' : 'asc');
        }
    }

    private function isFilterable(string $field, string $operator): bool
    {
        if (! array_key_exists($field, $this->filterable)) {
            return false;
        }

        $allowed = $this->filterable[$field];
        if ($allowed === true) {
            return true;
        }

        return in_array($operator, $allowed, true);
    }

    private function modelClass(): string
    {
        if ($this->modelClass === null || $this->modelClass === '') {
            throw new RuntimeException(static::class . ' must define $modelClass before using model helpers.');
        }

        return $this->modelClass;
    }
}
