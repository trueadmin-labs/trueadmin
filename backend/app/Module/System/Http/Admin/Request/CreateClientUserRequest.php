<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request;

final class CreateClientUserRequest extends SaveClientUserRequest
{
    public function rules(): array
    {
        return [...parent::rules(), 'password' => ['required', 'string', 'min:6', 'max:128']];
    }

    protected function normalize(array $data): array
    {
        return [
            ...parent::normalize($data),
            'status' => (string) ($data['status'] ?? 'enabled'),
            'registerChannel' => trim((string) ($data['registerChannel'] ?? 'admin')),
        ];
    }
}
