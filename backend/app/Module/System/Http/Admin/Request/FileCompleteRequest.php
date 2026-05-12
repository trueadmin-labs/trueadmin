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

final class FileCompleteRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'fileId' => ['required', 'integer', 'min:1'],
            'objectKey' => ['required', 'string', 'max:1024'],
            'etag' => ['sometimes', 'nullable', 'string', 'max:255'],
            'size' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ];
    }

    protected function normalize(array $data): array
    {
        return [
            'fileId' => (int) $data['fileId'],
            'objectKey' => trim((string) $data['objectKey']),
            'etag' => trim((string) ($data['etag'] ?? '')),
            'size' => array_key_exists('size', $data) && $data['size'] !== null ? (int) $data['size'] : null,
        ];
    }
}
