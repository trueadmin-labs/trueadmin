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

namespace App\Module\System\Http\Admin\Request;

use TrueAdmin\Kernel\Http\Request\FormRequest;

class SaveAdminPositionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'deptId' => ['required', 'integer', 'min:1'],
            'code' => ['required', 'string', 'max:64'],
            'name' => ['required', 'string', 'max:64'],
            'type' => ['sometimes', 'string', 'in:normal,system'],
            'isLeadership' => ['sometimes', 'boolean'],
            'description' => ['sometimes', 'string', 'max:512'],
            'sort' => ['sometimes', 'integer'],
            'status' => ['sometimes', 'string', 'in:enabled,disabled'],
            'roleIds' => ['sometimes', 'array'],
            'roleIds.*' => ['integer', 'min:1'],
        ];
    }

    protected function normalize(array $data): array
    {
        return [
            'deptId' => (int) $data['deptId'],
            'code' => trim((string) $data['code']),
            'name' => trim((string) $data['name']),
            'type' => trim((string) ($data['type'] ?? 'normal')) ?: 'normal',
            'isLeadership' => filter_var($data['isLeadership'] ?? false, FILTER_VALIDATE_BOOL),
            'description' => trim((string) ($data['description'] ?? '')),
            'sort' => (int) ($data['sort'] ?? 0),
            'status' => (string) ($data['status'] ?? 'enabled'),
            'roleIds' => array_values(array_unique(array_map('intval', $data['roleIds'] ?? []))),
        ];
    }
}
