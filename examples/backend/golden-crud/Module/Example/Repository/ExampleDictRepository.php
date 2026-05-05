<?php

declare(strict_types=1);

namespace App\Module\Example\Repository;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Foundation\Repository\AbstractRepository;
use App\Module\Example\Model\ExampleDict;

final class ExampleDictRepository extends AbstractRepository
{
    protected ?string $modelClass = ExampleDict::class;

    protected array $keywordFields = ['code', 'name', 'remark'];

    protected array $filterable = [
        'id' => ['=', 'in'],
        'code' => ['=', 'like'],
        'name' => ['=', 'like'],
        'status' => ['=', 'in'],
        'created_at' => ['between', '>=', '<='],
    ];

    protected array $sortable = ['id', 'sort', 'created_at', 'updated_at'];

    protected array $defaultSort = ['sort' => 'asc', 'id' => 'desc'];

    public function paginate(AdminQuery $adminQuery): PageResult
    {
        return $this->pageQuery(
            ExampleDict::query(),
            $adminQuery,
            fn (ExampleDict $dict): array => $this->toArray($dict),
        );
    }

    public function find(int $id): ?ExampleDict
    {
        /** @var null|ExampleDict $dict */
        $dict = $this->findModelById($id);

        return $dict;
    }

    public function findByCode(string $code): ?ExampleDict
    {
        return ExampleDict::query()->where('code', $code)->first();
    }

    public function create(array $data): ExampleDict
    {
        /** @var ExampleDict $dict */
        $dict = $this->createModel($data);

        return $dict;
    }

    public function update(ExampleDict $dict, array $data): ExampleDict
    {
        /** @var ExampleDict $dict */
        $dict = $this->updateModel($dict, $data);

        return $dict;
    }

    public function delete(ExampleDict $dict): void
    {
        $this->deleteModel($dict);
    }

    public function toArray(ExampleDict $dict): array
    {
        return [
            'id' => (int) $dict->getAttribute('id'),
            'code' => (string) $dict->getAttribute('code'),
            'name' => (string) $dict->getAttribute('name'),
            'status' => (string) $dict->getAttribute('status'),
            'sort' => (int) $dict->getAttribute('sort'),
            'remark' => (string) $dict->getAttribute('remark'),
            'createdAt' => (string) $dict->getAttribute('created_at'),
            'updatedAt' => (string) $dict->getAttribute('updated_at'),
        ];
    }
}
