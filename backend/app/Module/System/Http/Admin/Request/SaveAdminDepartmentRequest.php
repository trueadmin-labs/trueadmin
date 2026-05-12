<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request;

use TrueAdmin\Kernel\Http\Request\FormRequest;

final class SaveAdminDepartmentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'parentId' => ['sometimes', 'integer', 'min:0'],
            'code' => ['required', 'string', 'max:64'],
            'name' => ['required', 'string', 'max:64'],
            'sort' => ['sometimes', 'integer'],
            'status' => ['sometimes', 'string', 'in:enabled,disabled'],
        ];
    }

    protected function normalize(array $data): array
    {
        $normalized = [
            'code' => trim((string) $data['code']),
            'name' => trim((string) $data['name']),
        ];

        if (array_key_exists('parentId', $data)) {
            $normalized['parentId'] = (int) $data['parentId'];
        }
        if (array_key_exists('sort', $data)) {
            $normalized['sort'] = (int) $data['sort'];
        }
        if (array_key_exists('status', $data)) {
            $normalized['status'] = (string) $data['status'];
        }

        return $normalized;
    }
}
