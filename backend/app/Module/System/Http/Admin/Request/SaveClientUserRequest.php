<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request;

use TrueAdmin\Kernel\Http\Request\FormRequest;

class SaveClientUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'username' => ['sometimes', 'nullable', 'string', 'max:64'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'email' => ['sometimes', 'nullable', 'email', 'max:128'],
            'password' => ['sometimes', 'string', 'min:6', 'max:128'],
            'nickname' => ['sometimes', 'string', 'max:64'],
            'avatar' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'in:enabled,disabled'],
            'registerChannel' => ['sometimes', 'string', 'max:64'],
        ];
    }

    protected function normalize(array $data): array
    {
        $normalized = [];
        foreach (['username', 'phone', 'email', 'password', 'nickname', 'avatar', 'status', 'registerChannel'] as $field) {
            if (array_key_exists($field, $data)) {
                $normalized[$field] = trim((string) $data[$field]);
            }
        }

        return $normalized;
    }
}
