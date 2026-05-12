<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request\Notification;

use TrueAdmin\Kernel\Http\Request\FormRequest;

class AdminMessageReadAllRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'kind' => ['sometimes', 'nullable', 'string', 'in:all,notification,announcement'],
        ];
    }

    protected function normalize(array $data): array
    {
        return [
            'kind' => (string) ($data['kind'] ?? 'all'),
        ];
    }
}
