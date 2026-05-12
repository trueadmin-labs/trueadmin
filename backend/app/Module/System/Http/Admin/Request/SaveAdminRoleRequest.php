<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request;

use App\Foundation\Http\Request\FormRequest;

final class SaveAdminRoleRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:64'],
            'name' => ['required', 'string', 'max:64'],
            'sort' => ['sometimes', 'integer'],
            'status' => ['sometimes', 'string', 'in:enabled,disabled'],
            'menuIds' => ['sometimes', 'array'],
            'menuIds.*' => ['integer', 'min:1'],
            'dataPolicies' => ['sometimes', 'array'],
            'dataPolicies.*.resource' => ['required_with:dataPolicies', 'string', 'max:128'],
            'dataPolicies.*.action' => ['missing'],
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
        $normalized = [
            'code' => trim((string) $data['code']),
            'name' => trim((string) $data['name']),
        ];

        if (array_key_exists('sort', $data)) {
            $normalized['sort'] = (int) $data['sort'];
        }
        if (array_key_exists('status', $data)) {
            $normalized['status'] = (string) $data['status'];
        }
        if (array_key_exists('menuIds', $data)) {
            $normalized['menuIds'] = array_values(array_unique(array_map('intval', $data['menuIds'])));
        }
        if (array_key_exists('dataPolicies', $data)) {
            $normalized['dataPolicies'] = AuthorizeAdminRoleRequest::normalizeDataPolicies($data['dataPolicies']);
        }

        return $normalized;
    }
}
