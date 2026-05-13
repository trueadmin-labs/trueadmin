<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace App\Module\System\Http\Admin\Request;

final class CreateAdminUserRequest extends SaveAdminUserRequest
{
    public function rules(): array
    {
        return [...parent::rules(), 'password' => ['required', 'string', 'min:6', 'max:128']];
    }

    protected function normalize(array $data): array
    {
        return [
            ...parent::normalize($data),
            'nickname' => trim((string) ($data['nickname'] ?? '')),
            'status' => (string) ($data['status'] ?? 'enabled'),
            'roleIds' => array_values(array_unique(array_map('intval', $data['roleIds'] ?? []))),
            'positionIds' => array_values(array_unique(array_map('intval', $data['positionIds'] ?? []))),
        ];
    }
}
