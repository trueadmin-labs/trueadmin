<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request;

use TrueAdmin\Kernel\Http\Request\FormRequest;

final class UpdateAdminPasswordRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'oldPassword' => ['required', 'string', 'min:6', 'max:128'],
            'newPassword' => ['required', 'string', 'min:6', 'max:128'],
        ];
    }

    protected function normalize(array $data): array
    {
        return [
            'oldPassword' => (string) $data['oldPassword'],
            'newPassword' => (string) $data['newPassword'],
        ];
    }
}
