<?php

declare(strict_types=1);

namespace App\Module\System\Service\Notification;

use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AttachmentSnapshotNormalizer
{
    /**
     * @param mixed $value
     * @return list<array<string, mixed>>
     */
    public function normalize(mixed $value): array
    {
        if ($value === null || $value === []) {
            return [];
        }
        if (! is_array($value)) {
            $this->fail('attachments', 'attachments_must_be_array');
        }

        $items = [];
        foreach (array_values($value) as $index => $item) {
            if (! is_array($item)) {
                $this->fail('attachments.' . $index, 'attachment_must_be_object');
            }

            $id = $this->cleanString($item['id'] ?? '');
            $name = $this->cleanString($item['name'] ?? '');
            $url = $this->cleanString($item['url'] ?? '');

            if ($id === '' || mb_strlen($id) > 128) {
                $this->fail('attachments.' . $index . '.id', 'attachment_id_invalid');
            }
            if ($name === '' || mb_strlen($name) > 255) {
                $this->fail('attachments.' . $index . '.name', 'attachment_name_invalid');
            }
            if (str_contains($name, '/') || str_contains($name, '\\')) {
                $this->fail('attachments.' . $index . '.name', 'attachment_name_must_not_contain_path');
            }
            if ($url === '' || mb_strlen($url) > 1024 || ! $this->isSafeUrl($url)) {
                $this->fail('attachments.' . $index . '.url', 'attachment_url_invalid');
            }

            $extension = $this->nullableCleanString($item['extension'] ?? null);
            if ($extension !== null) {
                $extension = strtolower(ltrim($extension, '.'));
                if ($extension === '' || mb_strlen($extension) > 32 || preg_match('/^[a-z0-9][a-z0-9_-]*$/', $extension) !== 1) {
                    $this->fail('attachments.' . $index . '.extension', 'attachment_extension_invalid');
                }
            }

            $size = $item['size'] ?? null;
            if ($size !== null) {
                if (! is_numeric($size) || (int) $size < 0) {
                    $this->fail('attachments.' . $index . '.size', 'attachment_size_invalid');
                }
                $size = (int) $size;
            }

            $mimeType = $this->nullableCleanString($item['mimeType'] ?? null);
            if ($mimeType !== null && ($mimeType === '' || mb_strlen($mimeType) > 128)) {
                $this->fail('attachments.' . $index . '.mimeType', 'attachment_mime_type_invalid');
            }

            $items[] = array_filter([
                'id' => $id,
                'name' => $name,
                'url' => $url,
                'extension' => $extension,
                'size' => $size,
                'mimeType' => $mimeType,
            ], static fn (mixed $item): bool => $item !== null && $item !== '');
        }

        return $items;
    }

    private function cleanString(mixed $value): string
    {
        return trim(preg_replace('/[\x00-\x1F\x7F]/u', '', (string) $value) ?? '');
    }

    private function nullableCleanString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = $this->cleanString($value);

        return $value === '' ? null : $value;
    }

    private function isSafeUrl(string $url): bool
    {
        if (str_starts_with($url, '/')) {
            return ! str_starts_with($url, '//') && ! str_contains($url, "\n") && ! str_contains($url, "\r");
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true) && filter_var($url, FILTER_VALIDATE_URL) !== false;
    }

    private function fail(string $field, string $reason): never
    {
        throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
            'field' => $field,
            'reason' => $reason,
        ]);
    }
}
