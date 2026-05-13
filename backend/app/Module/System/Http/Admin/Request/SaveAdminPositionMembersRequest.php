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

use TrueAdmin\Kernel\Http\Request\FormRequest;

final class SaveAdminPositionMembersRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'userIds' => ['present', 'array'],
            'userIds.*' => ['integer', 'min:1'],
        ];
    }

    protected function normalize(array $data): array
    {
        return [
            'userIds' => array_values(array_unique(array_map('intval', $data['userIds'] ?? []))),
        ];
    }
}
