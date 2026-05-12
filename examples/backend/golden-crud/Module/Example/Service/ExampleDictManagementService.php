<?php

declare(strict_types=1);

namespace App\Module\Example\Service;

use App\Module\Example\Model\ExampleDict;
use App\Module\Example\Repository\ExampleDictRepository;
use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Pagination\PageResult;
use TrueAdmin\Kernel\Service\AbstractService;

final class ExampleDictManagementService extends AbstractService
{
    public function __construct(private readonly ExampleDictRepository $dicts)
    {
    }

    public function paginate(CrudQuery $query): PageResult
    {
        return $this->dicts->paginate($query);
    }

    public function detail(int $id): array
    {
        return $this->dicts->toArray($this->mustFind($id));
    }

    public function create(array $payload): array
    {
        $code = (string) $payload['code'];
        $this->assertUnique($this->dicts->findByCode($code) !== null, 'code');

        $dict = $this->dicts->create($this->data($payload));

        return $this->detail((int) $dict->getAttribute('id'));
    }

    public function update(int $id, array $payload): array
    {
        $dict = $this->mustFind($id);
        $code = (string) $payload['code'];
        $exists = $this->dicts->findByCode($code);
        $this->assertUnique($exists !== null && (int) $exists->getAttribute('id') !== $id, 'code');

        $dict = $this->dicts->update($dict, $this->data($payload, $dict));

        return $this->detail((int) $dict->getAttribute('id'));
    }

    public function delete(int $id): void
    {
        $this->dicts->delete($this->mustFind($id));
    }

    private function mustFind(int $id): ExampleDict
    {
        $dict = $this->dicts->find($id);
        if ($dict === null) {
            throw $this->notFound('example_dict', $id);
        }

        return $dict;
    }

    private function data(array $payload, ?ExampleDict $current = null): array
    {
        return [
            'code' => (string) ($payload['code'] ?? $current?->getAttribute('code') ?? ''),
            'name' => (string) ($payload['name'] ?? $current?->getAttribute('name') ?? ''),
            'status' => (string) ($payload['status'] ?? $current?->getAttribute('status') ?? 'enabled'),
            'sort' => (int) ($payload['sort'] ?? $current?->getAttribute('sort') ?? 0),
            'remark' => (string) ($payload['remark'] ?? $current?->getAttribute('remark') ?? ''),
        ];
    }
}
