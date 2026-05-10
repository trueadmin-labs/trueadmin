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

final class FileRemoteUrlRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'url' => ['required', 'string', 'max:2048'],
            'filename' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category' => ['sometimes', 'string', 'max:64'],
            'visibility' => ['sometimes', 'string', 'in:private,public'],
        ];
    }

    protected function normalize(array $data): array
    {
        return [
            'url' => trim((string) $data['url']),
            'filename' => array_key_exists('filename', $data) && $data['filename'] !== null ? trim((string) $data['filename']) : null,
            'category' => trim((string) ($data['category'] ?? 'attachment')),
            'visibility' => (string) ($data['visibility'] ?? 'public'),
        ];
    }
}
