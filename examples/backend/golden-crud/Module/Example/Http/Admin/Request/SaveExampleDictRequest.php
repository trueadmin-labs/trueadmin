<?php

declare(strict_types=1);

namespace App\Module\Example\Http\Admin\Request;

use TrueAdmin\Kernel\Http\Request\FormRequest;

final class SaveExampleDictRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:64'],
            'name' => ['required', 'string', 'max:64'],
            'status' => ['sometimes', 'string', 'in:enabled,disabled'],
            'sort' => ['sometimes', 'integer'],
            'remark' => ['sometimes', 'string', 'max:255'],
        ];
    }

    protected function normalize(array $data): array
    {
        $normalized = [
            'code' => trim((string) $data['code']),
            'name' => trim((string) $data['name']),
        ];

        if (array_key_exists('status', $data)) {
            $normalized['status'] = (string) $data['status'];
        }
        if (array_key_exists('sort', $data)) {
            $normalized['sort'] = (int) $data['sort'];
        }
        if (array_key_exists('remark', $data)) {
            $normalized['remark'] = trim((string) $data['remark']);
        }

        return $normalized;
    }
}
