<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request;

use TrueAdmin\Kernel\Http\Request\FormRequest;

final class UpdateAdminProfileRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'nickname' => ['required', 'string', 'max:64'],
            'avatar' => ['sometimes', 'nullable', 'string', 'max:512'],
        ];
    }

    protected function normalize(array $data): array
    {
        return [
            'nickname' => trim((string) $data['nickname']),
            'avatar' => trim((string) ($data['avatar'] ?? '')),
        ];
    }
}
