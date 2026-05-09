<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request\Notification;

use App\Foundation\Http\Request\FormRequest;

class SaveAdminNotificationBatchRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['sometimes', 'nullable', 'string'],
            'kind' => ['sometimes', 'string', 'in:notification,announcement'],
            'level' => ['sometimes', 'string', 'in:info,success,warning,error'],
            'type' => ['sometimes', 'string', 'max:64'],
            'source' => ['sometimes', 'string', 'max:64'],
            'targetType' => ['sometimes', 'string', 'in:all,role,user'],
            'targetRoleIds' => ['sometimes', 'array'],
            'targetRoleIds.*' => ['integer', 'min:1'],
            'targetUserIds' => ['sometimes', 'array'],
            'targetUserIds.*' => ['integer', 'min:1'],
            'targetUrl' => ['sometimes', 'nullable', 'string', 'max:512'],
            'payload' => ['sometimes', 'array'],
            'attachments' => ['sometimes', 'array'],
            'attachments.*.id' => ['required_with:attachments'],
            'attachments.*.name' => ['required_with:attachments', 'string', 'max:255'],
            'attachments.*.url' => ['required_with:attachments', 'string', 'max:1024'],
            'attachments.*.extension' => ['sometimes', 'nullable', 'string', 'max:32'],
            'attachments.*.size' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'attachments.*.mimeType' => ['sometimes', 'nullable', 'string', 'max:128'],
            'pinned' => ['sometimes', 'boolean'],
            'scheduledAt' => ['sometimes', 'nullable', 'date_format:Y-m-d H:i'],
        ];
    }

    protected function normalize(array $data): array
    {
        return [
            'title' => trim((string) $data['title']),
            'content' => array_key_exists('content', $data) ? (string) ($data['content'] ?? '') : null,
            'kind' => (string) ($data['kind'] ?? 'announcement'),
            'level' => (string) ($data['level'] ?? 'info'),
            'type' => trim((string) ($data['type'] ?? 'announcement')),
            'source' => trim((string) ($data['source'] ?? 'system')),
            'targetType' => (string) ($data['targetType'] ?? 'all'),
            'targetRoleIds' => $this->intList($data['targetRoleIds'] ?? []),
            'targetUserIds' => $this->intList($data['targetUserIds'] ?? []),
            'targetUrl' => $this->nullableString($data['targetUrl'] ?? null),
            'payload' => is_array($data['payload'] ?? null) ? $data['payload'] : [],
            'attachments' => $this->attachments($data['attachments'] ?? []),
            'pinned' => (bool) ($data['pinned'] ?? false),
            'scheduledAt' => $this->nullableString($data['scheduledAt'] ?? null),
        ];
    }

    private function nullableString(mixed $value): ?string
    {
        $value = trim((string) ($value ?? ''));

        return $value === '' ? null : $value;
    }

    private function intList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map('intval', $value), static fn (int $id): bool => $id > 0)));
    }

    private function stringList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map(static fn (mixed $item): string => trim((string) $item), $value), static fn (string $item): bool => $item !== '')));
    }

    private function attachments(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $items = [];
        foreach ($value as $item) {
            if (! is_array($item)) {
                continue;
            }
            $items[] = array_filter([
                'id' => (string) ($item['id'] ?? ''),
                'name' => (string) ($item['name'] ?? ''),
                'url' => (string) ($item['url'] ?? ''),
                'extension' => isset($item['extension']) ? (string) $item['extension'] : null,
                'size' => isset($item['size']) ? (int) $item['size'] : null,
                'mimeType' => isset($item['mimeType']) ? (string) $item['mimeType'] : null,
            ], static fn (mixed $item): bool => $item !== null && $item !== '');
        }

        return $items;
    }
}
