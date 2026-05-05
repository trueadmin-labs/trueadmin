<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request;

use App\Foundation\Http\Request\FormRequest;

class SaveAdminUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:64'],
            'password' => ['sometimes', 'string', 'min:6', 'max:128'],
            'nickname' => ['sometimes', 'string', 'max:64'],
            'status' => ['sometimes', 'string', 'in:enabled,disabled'],
            'roleIds' => ['sometimes', 'array'],
            'roleIds.*' => ['integer', 'min:1'],
            'deptIds' => ['sometimes', 'array'],
            'deptIds.*' => ['integer', 'min:1'],
            'deptId' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'primaryDeptId' => ['sometimes', 'nullable', 'integer', 'min:1'],
        ];
    }

    protected function normalize(array $data): array
    {
        $normalized = [
            'username' => trim((string) $data['username']),
        ];

        if (array_key_exists('password', $data)) {
            $normalized['password'] = trim((string) $data['password']);
        }
        if (array_key_exists('nickname', $data)) {
            $normalized['nickname'] = trim((string) $data['nickname']);
        }
        if (array_key_exists('status', $data)) {
            $normalized['status'] = (string) $data['status'];
        }
        if (array_key_exists('roleIds', $data)) {
            $normalized['roleIds'] = array_values(array_unique(array_map('intval', $data['roleIds'])));
        }
        if (array_key_exists('deptIds', $data)) {
            $normalized['deptIds'] = array_values(array_unique(array_map('intval', $data['deptIds'])));
        }
        if (array_key_exists('deptId', $data)) {
            $normalized['deptId'] = $data['deptId'] === null || $data['deptId'] === '' ? null : (int) $data['deptId'];
        }
        if (array_key_exists('primaryDeptId', $data)) {
            $normalized['primaryDeptId'] = $data['primaryDeptId'] === null || $data['primaryDeptId'] === '' ? null : (int) $data['primaryDeptId'];
        }

        return $normalized;
    }
}
