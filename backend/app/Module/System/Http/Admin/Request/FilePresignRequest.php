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

use App\Foundation\Http\Request\FormRequest;

final class FilePresignRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'filename' => ['required', 'string', 'max:255'],
            'contentType' => ['required', 'string', 'max:128'],
            'size' => ['required', 'integer', 'min:1'],
            'category' => ['sometimes', 'string', 'max:64'],
            'visibility' => ['sometimes', 'string', 'in:private,public'],
        ];
    }

    protected function normalize(array $data): array
    {
        return [
            'filename' => trim((string) $data['filename']),
            'contentType' => trim((string) $data['contentType']),
            'size' => (int) $data['size'],
            'category' => trim((string) ($data['category'] ?? 'attachment')),
            'visibility' => (string) ($data['visibility'] ?? 'public'),
        ];
    }
}
