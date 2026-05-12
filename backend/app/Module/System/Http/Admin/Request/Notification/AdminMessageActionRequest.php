<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request\Notification;

use TrueAdmin\Kernel\Http\Request\FormRequest;

class AdminMessageActionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'messages' => ['required', 'array'],
            'messages.*.kind' => ['required', 'string', 'in:notification,announcement'],
            'messages.*.id' => ['required', 'integer', 'min:1'],
        ];
    }

    protected function normalize(array $data): array
    {
        return [
            'messages' => array_values(array_map(static fn (array $item): array => [
                'kind' => (string) $item['kind'],
                'id' => (int) $item['id'],
            ], $data['messages'] ?? [])),
        ];
    }
}
