<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use App\Foundation\Service\AbstractService;
use Hyperf\HttpMessage\Upload\UploadedFile;
use RuntimeException;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminUploadService extends AbstractService
{
    private const IMAGE_MIME_TYPES = [
        'image/gif' => 'gif',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    private const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

    public function image(UploadedFile $file): array
    {
        if ($file->getError() !== UPLOAD_ERR_OK) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'file', 'reason' => 'upload_failed']);
        }

        $size = (int) $file->getSize();
        if ($size <= 0 || $size > self::MAX_IMAGE_SIZE) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'file', 'reason' => 'image_size_invalid']);
        }

        $mimeType = $file->getMimeType();
        $extension = self::IMAGE_MIME_TYPES[$mimeType] ?? null;
        if ($extension === null) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'file', 'reason' => 'image_type_invalid']);
        }

        $relativeDirectory = '/uploads/images/' . date('Ymd');
        $directory = BASE_PATH . '/public' . $relativeDirectory;
        if (! is_dir($directory) && ! mkdir($directory, 0755, true) && ! is_dir($directory)) {
            throw new RuntimeException('Unable to create upload directory: ' . $directory);
        }

        $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        $relativePath = $relativeDirectory . '/' . $filename;
        $file->moveTo(BASE_PATH . '/public' . $relativePath);

        return [
            'id' => ltrim($relativePath, '/'),
            'name' => pathinfo((string) $file->getClientFilename(), PATHINFO_FILENAME) ?: $filename,
            'url' => $relativePath,
            'size' => $size,
            'mimeType' => $mimeType,
        ];
    }
}
