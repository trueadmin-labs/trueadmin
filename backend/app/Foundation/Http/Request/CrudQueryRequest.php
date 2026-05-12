<?php

declare(strict_types=1);

namespace App\Foundation\Http\Request;

use App\Foundation\Crud\CrudFilterCondition;
use App\Foundation\Crud\CrudOperator;
use App\Foundation\Crud\CrudQuery;
use App\Foundation\Crud\CrudSortOrder;
use App\Foundation\Crud\CrudSortRule;

class CrudQueryRequest extends FormRequest
{
    private const FIELD_PATTERN = '/^[A-Za-z0-9_.]+$/';

    /**
     * @var list<string>
     */
    private const ROOT_KEYS = ['page', 'pageSize', 'keyword', 'filters', 'sorts', 'params'];

    protected int $defaultPageSize = 20;

    protected int $maxPageSize = 100;

    protected int $maxFilterConditions = 20;

    protected int $maxSortRules = 5;

    public function rules(): array
    {
        return [
            '__unsupportedCrudKeys' => ['missing'],
            '__invalidCrudParamKeys' => ['missing'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'pageSize' => ['sometimes', 'integer', 'min:1', 'max:' . $this->maxPageSize],
            'keyword' => ['sometimes', 'string', 'max:100'],
            'filters' => ['sometimes', 'array', 'max:' . $this->maxFilterConditions],
            'filters.*.field' => ['required_with:filters', 'string', 'max:64', 'regex:' . self::FIELD_PATTERN],
            'filters.*.op' => ['required_with:filters', 'string', 'in:' . implode(',', $this->operatorValues())],
            'filters.*.value' => ['sometimes'],
            'sorts' => ['sometimes', 'array', 'max:' . $this->maxSortRules],
            'sorts.*.field' => ['required_with:sorts', 'string', 'max:64', 'regex:' . self::FIELD_PATTERN],
            'sorts.*.order' => ['required_with:sorts', 'string', 'in:asc,desc'],
            'sorts.*.nulls' => ['sometimes', 'string', 'in:first,last'],
            'params' => ['sometimes', 'array'],
        ];
    }

    protected function validationData(): array
    {
        $data = parent::validationData();

        $unsupportedKeys = array_values(array_diff(array_keys($data), self::ROOT_KEYS));
        if ($unsupportedKeys !== []) {
            $data['__unsupportedCrudKeys'] = $unsupportedKeys;
        }

        $invalidParamKeys = [];
        if (isset($data['params']) && is_array($data['params'])) {
            foreach (array_keys($data['params']) as $field) {
                if (! is_string($field) || ! $this->isAllowedField($field)) {
                    $invalidParamKeys[] = $field;
                }
            }
        }
        if ($invalidParamKeys !== []) {
            $data['__invalidCrudParamKeys'] = $invalidParamKeys;
        }

        return $data;
    }

    protected function normalize(array $data): array
    {
        return [
            'page' => (int) ($data['page'] ?? 1),
            'pageSize' => (int) ($data['pageSize'] ?? $this->defaultPageSize),
            'keyword' => trim((string) ($data['keyword'] ?? '')),
            'filters' => $this->decodeFilters($data['filters'] ?? []),
            'sorts' => $this->decodeSorts($data['sorts'] ?? []),
            'params' => $this->decodeParams($data['params'] ?? []),
        ];
    }

    public function crudQuery(): CrudQuery
    {
        $validated = $this->validated();

        return new CrudQuery(
            page: $validated['page'],
            pageSize: $validated['pageSize'],
            keyword: $validated['keyword'],
            filters: $validated['filters'],
            sorts: $validated['sorts'],
            params: $validated['params'],
        );
    }

    /**
     * @return list<CrudFilterCondition>
     */
    private function decodeFilters(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $conditions = [];
        foreach (array_slice(array_values($value), 0, $this->maxFilterConditions) as $item) {
            if (! is_array($item)) {
                continue;
            }

            $field = trim((string) ($item['field'] ?? ''));
            $operator = CrudOperator::tryFrom(strtolower(trim((string) ($item['op'] ?? ''))));
            if (! $this->isAllowedField($field) || $operator === null) {
                continue;
            }

            $value = $this->normalizeValue($item['value'] ?? null);
            if (! in_array($operator, [CrudOperator::IsNull, CrudOperator::NotNull], true) && $this->isEmptyValue($value)) {
                continue;
            }

            $conditions[] = new CrudFilterCondition($field, $operator, $value);
        }

        return $conditions;
    }

    /**
     * @return list<CrudSortRule>
     */
    private function decodeSorts(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $sorts = [];
        foreach (array_slice(array_values($value), 0, $this->maxSortRules) as $item) {
            if (! is_array($item)) {
                continue;
            }

            $field = trim((string) ($item['field'] ?? ''));
            $order = CrudSortOrder::tryFrom(strtolower(trim((string) ($item['order'] ?? ''))));
            $nulls = isset($item['nulls']) ? strtolower(trim((string) $item['nulls'])) : null;
            if (! $this->isAllowedField($field) || $order === null) {
                continue;
            }
            if (! in_array($nulls, [null, 'first', 'last'], true)) {
                $nulls = null;
            }

            $sorts[] = new CrudSortRule($field, $order, $nulls);
        }

        return $sorts;
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeParams(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $params = [];
        foreach ($value as $field => $fieldValue) {
            if (! is_string($field) || ! $this->isAllowedField($field) || $this->isEmptyValue($fieldValue)) {
                continue;
            }
            $params[$field] = $this->normalizeValue($fieldValue);
        }

        return $params;
    }

    private function isAllowedField(string $field): bool
    {
        return preg_match(self::FIELD_PATTERN, $field) === 1;
    }

    /**
     * @return list<string>
     */
    private function operatorValues(): array
    {
        return array_map(
            static fn (CrudOperator $operator): string => $operator->value,
            CrudOperator::cases(),
        );
    }

    private function isEmptyValue(mixed $value): bool
    {
        if (is_string($value)) {
            $value = trim($value);
        }

        if ($value === null || $value === '' || $value === 'all') {
            return true;
        }

        if (! is_array($value)) {
            return false;
        }

        return $this->normalizeValue($value) === [];
    }

    private function normalizeValue(mixed $value): mixed
    {
        if (! is_array($value)) {
            return is_string($value) ? trim($value) : $value;
        }

        return array_values(array_filter(
            array_map(static function (mixed $item): mixed {
                if (! is_scalar($item)) {
                    return null;
                }

                return is_string($item) ? trim($item) : $item;
            }, $value),
            static fn (mixed $item): bool => $item !== null && $item !== '' && $item !== 'all',
        ));
    }
}
