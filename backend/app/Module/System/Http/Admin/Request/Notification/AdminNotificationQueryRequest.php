<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request\Notification;

use App\Foundation\Http\Request\AdminQueryRequest;

class AdminNotificationQueryRequest extends AdminQueryRequest
{
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'kind' => ['sometimes', 'string', 'in:all,notification,announcement'],
            'status' => ['sometimes', 'string', 'max:32'],
            'level' => ['sometimes', 'string', 'max:32'],
            'type' => ['sometimes', 'string', 'max:64'],
            'source' => ['sometimes', 'string', 'max:64'],
            'targetType' => ['sometimes', 'string', 'max:32'],
            'startAt' => ['sometimes', 'string', 'max:32'],
            'endAt' => ['sometimes', 'string', 'max:32'],
        ];
    }
}
