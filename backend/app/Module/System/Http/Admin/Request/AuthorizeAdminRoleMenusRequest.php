<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request;

use App\Foundation\Http\Request\FormRequest;

final class AuthorizeAdminRoleMenusRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'menuIds' => ['present', 'array'],
            'menuIds.*' => ['integer', 'min:1'],
        ];
    }

    protected function normalize(array $data): array
    {
        return [
            'menuIds' => array_values(array_unique(array_map('intval', $data['menuIds'] ?? []))),
        ];
    }
}
