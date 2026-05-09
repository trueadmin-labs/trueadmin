<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Request\Notification;

use App\Foundation\Http\Request\FormRequest;
use App\Module\System\Service\Notification\AttachmentSnapshotNormalizer;
use Hyperf\Context\ApplicationContext;

class SaveAdminAnnouncementRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['sometimes', 'nullable', 'string'],
            'level' => ['sometimes', 'string', 'in:info,success,warning,error'],
            'source' => ['sometimes', 'string', 'max:64'],
            'targetType' => ['sometimes', 'string', 'in:all,role'],
            'targetRoleIds' => ['sometimes', 'array'],
            'targetRoleIds.*' => ['integer', 'min:1'],
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
            'expireAt' => ['sometimes', 'nullable', 'date_format:Y-m-d H:i'],
            'publishMode' => ['sometimes', 'string', 'in:draft,publish'],
        ];
    }

    protected function normalize(array $data): array
    {
        return [
            'title' => trim((string) $data['title']),
            'content' => array_key_exists('content', $data) ? (string) ($data['content'] ?? '') : null,
            'level' => (string) ($data['level'] ?? 'info'),
            'type' => 'announcement',
            'source' => trim((string) ($data['source'] ?? 'system')),
            'targetType' => (string) ($data['targetType'] ?? 'all'),
            'targetRoleIds' => $this->intList($data['targetRoleIds'] ?? []),
            'targetUrl' => $this->nullableString($data['targetUrl'] ?? null),
            'payload' => is_array($data['payload'] ?? null) ? $data['payload'] : [],
            'attachments' => $this->attachmentNormalizer()->normalize($data['attachments'] ?? []),
            'pinned' => (bool) ($data['pinned'] ?? false),
            'scheduledAt' => $this->nullableString($data['scheduledAt'] ?? null),
            'expireAt' => $this->nullableString($data['expireAt'] ?? null),
            'publishMode' => (string) ($data['publishMode'] ?? 'publish'),
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

    private function attachmentNormalizer(): AttachmentSnapshotNormalizer
    {
        return ApplicationContext::getContainer()->get(AttachmentSnapshotNormalizer::class);
    }
}
