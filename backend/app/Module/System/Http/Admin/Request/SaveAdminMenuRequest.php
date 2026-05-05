<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request;

use App\Foundation\Http\Request\FormRequest;

final class SaveAdminMenuRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'parentId' => ['sometimes', 'integer', 'min:0'],
            'parent_id' => ['sometimes', 'integer', 'min:0'],
            'code' => ['sometimes', 'string', 'max:128'],
            'type' => ['sometimes', 'string', 'in:directory,menu,button'],
            'name' => ['required', 'string', 'max:64'],
            'path' => ['sometimes', 'string', 'max:255'],
            'component' => ['sometimes', 'string', 'max:255'],
            'icon' => ['sometimes', 'string', 'max:64'],
            'permission' => ['sometimes', 'string', 'max:128'],
            'sort' => ['sometimes', 'integer'],
            'status' => ['sometimes', 'string', 'in:enabled,disabled'],
        ];
    }

    protected function normalize(array $data): array
    {
        $normalized = [
            'name' => trim((string) $data['name']),
        ];

        if (array_key_exists('parentId', $data) || array_key_exists('parent_id', $data)) {
            $normalized['parentId'] = (int) ($data['parentId'] ?? $data['parent_id']);
        }
        foreach (['code', 'path', 'component', 'icon', 'permission'] as $field) {
            if (array_key_exists($field, $data)) {
                $normalized[$field] = trim((string) $data[$field]);
            }
        }
        if (array_key_exists('type', $data)) {
            $normalized['type'] = (string) $data['type'];
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
