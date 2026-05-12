<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request\Notification;

use TrueAdmin\Kernel\Crud\CrudQueryRequest;

class AdminNotificationQueryRequest extends CrudQueryRequest
{
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'params.kind' => ['sometimes', 'string', 'in:all,notification,announcement'],
            'params.status' => ['sometimes', 'string', 'max:32'],
            'params.level' => ['sometimes', 'string', 'max:32'],
            'params.type' => ['sometimes', 'string', 'max:64'],
            'params.source' => ['sometimes', 'string', 'max:64'],
            'params.targetType' => ['sometimes', 'string', 'max:32'],
            'params.startAt' => ['sometimes', 'string', 'max:32'],
            'params.endAt' => ['sometimes', 'string', 'max:32'],
        ];
    }
}
