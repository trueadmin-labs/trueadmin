<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request;

use TrueAdmin\Kernel\Http\Request\FormRequest;

final class UpdateAdminPreferencesRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'namespace' => ['required', 'string', 'max:128', 'regex:/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/'],
            'values' => ['required', 'array'],
        ];
    }

    protected function normalize(array $data): array
    {
        return [
            'namespace' => trim((string) $data['namespace']),
            'values' => is_array($data['values'] ?? null) ? $data['values'] : [],
        ];
    }
}
