<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request;

use App\Foundation\Http\Request\FormRequest;

final class AuthorizeAdminRoleRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'menuIds' => ['present', 'array'],
            'menuIds.*' => ['integer', 'min:1'],
            'dataPolicies' => ['sometimes', 'array'],
            'dataPolicies.*.resource' => ['required_with:dataPolicies', 'string', 'max:128'],
            'dataPolicies.*.action' => ['prohibited'],
            'dataPolicies.*.strategy' => ['required_with:dataPolicies', 'string', 'max:64'],
            'dataPolicies.*.effect' => ['sometimes', 'string', 'in:allow'],
            'dataPolicies.*.scope' => ['required_with:dataPolicies', 'string', 'in:all,self,department,department_and_children,custom_departments,custom_departments_and_children'],
            'dataPolicies.*.config' => ['sometimes', 'array'],
            'dataPolicies.*.config.deptIds' => ['sometimes', 'array'],
            'dataPolicies.*.config.deptIds.*' => ['integer', 'min:1'],
        ];
    }

    protected function normalize(array $data): array
    {
        return [
            'menuIds' => array_values(array_unique(array_map('intval', $data['menuIds'] ?? []))),
            'dataPolicies' => self::normalizeDataPolicies($data['dataPolicies'] ?? []),
        ];
    }

    public static function normalizeDataPolicies(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $policies = [];
        foreach ($value as $index => $item) {
            if (! is_array($item)) {
                continue;
            }
            $config = is_array($item['config'] ?? null) ? $item['config'] : [];
            if (isset($config['deptIds']) && is_array($config['deptIds'])) {
                $config['deptIds'] = array_values(array_unique(array_map('intval', $config['deptIds'])));
            }

            $policies[] = [
                'resource' => (string) ($item['resource'] ?? ''),
                'strategy' => (string) ($item['strategy'] ?? ''),
                'effect' => (string) ($item['effect'] ?? 'allow'),
                'scope' => (string) ($item['scope'] ?? ''),
                'config' => $config,
                'status' => 'enabled',
                'sort' => (int) ($item['sort'] ?? $index),
            ];
        }

        return $policies;
    }
}
