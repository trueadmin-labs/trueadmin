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

namespace App\Module\System\Service;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Foundation\Service\AbstractService;
use App\Module\System\Dto\FileUploadContext;
use App\Module\System\Model\File;
use App\Module\System\Repository\FileRepository;
use GuzzleHttp\Psr7\Utils;
use Hyperf\HttpMessage\Upload\UploadedFile;
use League\Flysystem\UnableToWriteFile;
use League\MimeTypeDetection\FinfoMimeTypeDetector;
use Psr\Http\Message\StreamInterface;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Context\Actor;
use TrueAdmin\Kernel\Exception\BusinessException;

final class FileService extends AbstractService
{
    private const STATUS_PENDING = 'pending';

    private const STATUS_READY = 'ready';

    private const DISK_LOCAL = 'local';

    private const DISK_OSS = 'oss';

    private readonly FinfoMimeTypeDetector $mimeTypes;

    public function __construct(
        private readonly FileRepository $files,
        private readonly FileStorageManager $storage,
    ) {
        $this->mimeTypes = new FinfoMimeTypeDetector(bufferSampleSize: 8192);
    }

    public function paginate(AdminQuery $query, Actor $actor, ?string $origin = null): PageResult
    {
        return $this->files->paginate($query, $actor, fn (File $file): array => $this->toArray($file, $origin));
    }

    public function upload(UploadedFile $uploadedFile, FileUploadContext $context, ?string $origin = null): array
    {
        $this->assertUploadedFile($uploadedFile);

        $filename = $this->cleanFilename((string) $uploadedFile->getClientFilename());
        $stream = fopen($uploadedFile->getPathname(), 'rb');
        if ($stream === false) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'file', 'reason' => 'file_stream_unavailable']);
        }

        try {
            return $this->storeFromStream(
                stream: $stream,
                filename: $filename,
                context: $context,
                origin: $origin,
                size: (int) $uploadedFile->getSize(),
                sourcePath: $uploadedFile->getPathname(),
                metadata: ['clientFilename' => $filename],
                allowServerSideStorage: false,
            );
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }
    }

    public function storeFromContents(string $contents, string $filename, FileUploadContext $context, ?string $origin = null, ?string $mimeType = null): array
    {
        $stream = fopen('php://temp', 'w+b');
        if ($stream === false) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'file', 'reason' => 'file_stream_unavailable']);
        }

        try {
            fwrite($stream, $contents);
            rewind($stream);

            return $this->storeFromStream(
                stream: $stream,
                filename: $filename,
                context: $context,
                origin: $origin,
                size: strlen($contents),
                mimeType: $mimeType ?? $this->detectMimeTypeFromBuffer($contents, $filename),
            );
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }
    }

    /**
     * @param resource|StreamInterface $stream
     */
    public function storeFromStream(mixed $stream, string $filename, FileUploadContext $context, ?string $origin = null, ?int $size = null, ?string $mimeType = null, ?string $sourcePath = null, array $metadata = [], bool $allowServerSideStorage = true): array
    {
        $filename = $this->cleanFilename($filename);
        $extension = $this->extension($filename, '');
        $size ??= $this->streamSize($stream);
        $this->assertSize($size);

        $mimeType = $this->normalizeMimeType($mimeType) ?? $this->detectMimeType($filename, $stream, $sourcePath);
        $disk = $this->storage->disk();
        if ($disk !== self::DISK_LOCAL && ! $allowServerSideStorage) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'disk', 'reason' => 'use_presign_for_non_local_disk']);
        }

        $this->rewindStream($stream);
        $hash = $this->streamHash($stream);
        $this->rewindStream($stream);

        $path = $this->objectKey($context, $extension);
        try {
            $this->storage->filesystem($disk)->writeStream($path, $this->streamResource($stream));
        } catch (UnableToWriteFile) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'file', 'reason' => 'write_failed']);
        }

        $file = $this->files->create([
            ...$this->ownerData($context),
            'disk' => $disk,
            'name' => $this->basename($filename),
            'extension' => $extension,
            'mime_type' => $mimeType,
            'size' => $size,
            'hash' => $hash,
            'path' => $path,
            'url' => $this->storage->absoluteUrl($disk, $path, $origin),
            'status' => self::STATUS_READY,
            'metadata' => $metadata,
        ]);

        return $this->toArray($file, $origin);
    }

    public function storeFromRemoteUrl(string $url, FileUploadContext $context, ?string $origin = null, ?string $filename = null): array
    {
        $remote = $this->storage->downloadRemoteFile($url, $this->storage->maxSize());

        try {
            $stream = fopen($remote['path'], 'rb');
            if ($stream === false) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'url', 'reason' => 'remote_file_stream_unavailable']);
            }

            try {
                return $this->storeFromStream(
                    stream: $stream,
                    filename: $filename !== null && trim($filename) !== '' ? $filename : $remote['filename'],
                    context: $context,
                    origin: $origin,
                    size: $remote['size'],
                    sourcePath: $remote['path'],
                    metadata: ['remoteUrl' => $url],
                );
            } finally {
                if (is_resource($stream)) {
                    fclose($stream);
                }
            }
        } finally {
            if (is_file($remote['path'])) {
                unlink($remote['path']);
            }
        }
    }

    public function presign(array $input, FileUploadContext $context, ?string $origin = null): array
    {
        $this->assertSize((int) $input['size']);
        $this->storage->assertOssReady();

        $filename = $this->cleanFilename((string) $input['filename']);
        $extension = $this->extension($filename, '');
        $mimeType = $this->normalizeMimeType((string) $input['contentType']) ?? $this->detectMimeTypeFromPath($filename);
        $path = $this->objectKey($context, $extension);
        $file = $this->files->create([
            ...$this->ownerData($context),
            'disk' => self::DISK_OSS,
            'name' => $this->basename($filename),
            'extension' => $extension,
            'mime_type' => $mimeType,
            'size' => (int) $input['size'],
            'hash' => '',
            'path' => $path,
            'url' => $this->storage->absoluteUrl(self::DISK_OSS, $path, $origin),
            'status' => self::STATUS_PENDING,
            'metadata' => ['clientFilename' => $filename],
        ]);

        $presigned = $this->storage->presignedPutUrl($path, $mimeType);

        return [
            'fileId' => (int) $file->getAttribute('id'),
            'disk' => self::DISK_OSS,
            'method' => 'PUT',
            'uploadUrl' => $presigned['url'],
            'objectKey' => $path,
            'headers' => $presigned['headers'],
            'expiresAt' => $presigned['expiresAt'],
            'file' => $this->toArray($file, $origin),
        ];
    }

    public function complete(array $input, Actor $actor, ?string $origin = null): array
    {
        $file = $this->mustFind((int) $input['fileId']);
        $this->assertOwner($file, $actor);
        if ((string) $file->getAttribute('status') !== self::STATUS_PENDING) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'fileId', 'reason' => 'file_not_pending']);
        }
        if ((string) $file->getAttribute('path') !== (string) $input['objectKey']) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'objectKey', 'reason' => 'object_key_mismatch']);
        }

        $metadata = $file->getAttribute('metadata') ?: [];
        if (! is_array($metadata)) {
            $metadata = [];
        }
        if (($input['etag'] ?? '') !== '') {
            $metadata['etag'] = (string) $input['etag'];
        }

        $updated = $this->files->update($file, [
            'size' => $input['size'] ?? (int) $file->getAttribute('size'),
            'status' => self::STATUS_READY,
            'metadata' => $metadata,
        ]);

        return $this->toArray($updated, $origin);
    }

    public function detail(int $id, Actor $actor, ?string $origin = null): array
    {
        $file = $this->mustFind($id);
        $this->assertManageable($file, $actor);

        return $this->toArray($file, $origin);
    }

    public function mustFind(int $id): File
    {
        $file = $this->files->find($id);
        if ($file === null) {
            throw $this->notFound('file', $id);
        }

        return $file;
    }

    public function toArray(File $file, ?string $origin = null): array
    {
        $disk = (string) $file->getAttribute('disk');
        $path = (string) $file->getAttribute('path');
        $relativeUrl = $this->storage->relativeUrl($disk, $path);
        $absoluteUrl = $this->storage->absoluteUrl($disk, $path, $origin);

        return [
            'id' => (int) $file->getAttribute('id'),
            'scope' => (string) $file->getAttribute('scope'),
            'ownerType' => (string) $file->getAttribute('owner_type'),
            'ownerId' => (string) $file->getAttribute('owner_id'),
            'ownerDeptId' => $file->getAttribute('owner_dept_id') === null ? null : (int) $file->getAttribute('owner_dept_id'),
            'category' => (string) $file->getAttribute('category'),
            'disk' => $disk,
            'visibility' => (string) $file->getAttribute('visibility'),
            'name' => (string) $file->getAttribute('name'),
            'extension' => (string) $file->getAttribute('extension'),
            'mimeType' => (string) $file->getAttribute('mime_type'),
            'size' => (int) $file->getAttribute('size'),
            'hash' => (string) $file->getAttribute('hash'),
            'path' => $path,
            'relativeUrl' => $relativeUrl,
            'absoluteUrl' => $absoluteUrl,
            'url' => $absoluteUrl,
            'status' => (string) $file->getAttribute('status'),
        ];
    }

    private function assertUploadedFile(UploadedFile $file): void
    {
        if ($file->getError() !== UPLOAD_ERR_OK) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'file', 'reason' => 'upload_failed']);
        }
    }

    private function assertSize(int $size): void
    {
        if ($size <= 0 || $size > $this->storage->maxSize()) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'file', 'reason' => 'file_size_invalid']);
        }
    }

    private function ownerData(FileUploadContext $context): array
    {
        return [
            'scope' => $context->scope,
            'owner_type' => $context->ownerType,
            'owner_id' => $context->ownerId,
            'owner_dept_id' => $context->ownerDeptId,
            'category' => $context->category,
            'visibility' => $context->visibility,
        ];
    }

    private function assertManageable(File $file, Actor $actor): void
    {
        $permissions = $actor->claims['permissions'] ?? [];
        if ($actor->type === 'admin' && is_array($permissions) && (in_array('*', $permissions, true) || in_array('system:file:all', $permissions, true))) {
            return;
        }

        $this->assertOwner($file, $actor);
    }

    private function assertOwner(File $file, Actor $actor): void
    {
        if ((string) $file->getAttribute('scope') === $actor->type
            && (string) $file->getAttribute('owner_id') === (string) $actor->id) {
            return;
        }

        throw new BusinessException(ErrorCode::FORBIDDEN, 403, ['reason' => 'file_owner_required']);
    }

    private function cleanFilename(string $filename): string
    {
        $filename = trim(str_replace(["\0", '/', '\\'], '', $filename));

        return $filename === '' ? 'file' : mb_substr($filename, 0, 255);
    }

    private function basename(string $filename): string
    {
        $name = pathinfo($filename, PATHINFO_FILENAME);

        return mb_substr($name !== '' ? $name : $filename, 0, 255);
    }

    private function extension(string $filename, string $fallback): string
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION) ?: $fallback);
        $extension = preg_replace('/[^a-z0-9]+/', '', $extension) ?? '';

        return mb_substr($extension, 0, 32);
    }

    private function objectKey(FileUploadContext $context, string $extension): string
    {
        $category = preg_replace('/[^a-zA-Z0-9_-]+/', '-', $context->category) ?: 'attachment';
        $suffix = $extension !== '' ? '.' . $extension : '';

        return sprintf(
            '%s/%s/%s/%s%s',
            $context->scope,
            $category,
            date('Y/m'),
            bin2hex(random_bytes(16)),
            $suffix,
        );
    }

    private function normalizeMimeType(?string $mimeType): ?string
    {
        $mimeType = trim((string) $mimeType);
        if ($mimeType === '' || $mimeType === 'application/x-empty') {
            return null;
        }

        return mb_substr($mimeType, 0, 128);
    }

    private function detectMimeType(string $filename, mixed $stream, ?string $sourcePath): string
    {
        if ($sourcePath !== null && is_file($sourcePath)) {
            $mimeType = $this->normalizeMimeType($this->mimeTypes->detectMimeTypeFromFile($sourcePath));
            if ($mimeType !== null && $mimeType !== 'text/plain') {
                return $mimeType;
            }
        }

        $sample = $this->streamSample($stream);
        if ($sample !== '') {
            $mimeType = $this->normalizeMimeType($this->mimeTypes->detectMimeType($filename, $sample));
            if ($mimeType !== null) {
                return $mimeType;
            }
        }

        return $this->detectMimeTypeFromPath($filename);
    }

    private function detectMimeTypeFromBuffer(string $contents, string $filename): string
    {
        return $this->normalizeMimeType($this->mimeTypes->detectMimeType($filename, $contents))
            ?? $this->detectMimeTypeFromPath($filename);
    }

    private function detectMimeTypeFromPath(string $filename): string
    {
        return $this->normalizeMimeType($this->mimeTypes->detectMimeTypeFromPath($filename)) ?? 'application/octet-stream';
    }

    private function streamSize(mixed $stream): int
    {
        if (is_resource($stream)) {
            $stats = fstat($stream);

            return isset($stats['size']) ? (int) $stats['size'] : 0;
        }
        if ($stream instanceof StreamInterface) {
            $size = $stream->getSize();

            return $size === null ? 0 : (int) $size;
        }

        return 0;
    }

    private function rewindStream(mixed $stream): void
    {
        if (is_resource($stream) && stream_get_meta_data($stream)['seekable']) {
            rewind($stream);
            return;
        }
        if ($stream instanceof StreamInterface && $stream->isSeekable()) {
            $stream->rewind();
        }
    }

    private function streamHash(mixed $stream): string
    {
        $context = hash_init('sha256');
        if (is_resource($stream)) {
            hash_update_stream($context, $stream);

            return hash_final($context);
        }

        if ($stream instanceof StreamInterface) {
            while (! $stream->eof()) {
                hash_update($context, $stream->read(8192));
            }

            return hash_final($context);
        }

        return '';
    }

    /**
     * @return resource
     */
    private function streamResource(mixed $stream): mixed
    {
        if (is_resource($stream)) {
            return $stream;
        }
        if ($stream instanceof StreamInterface) {
            return Utils::streamFor($stream)->detach();
        }

        throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'file', 'reason' => 'file_stream_unavailable']);
    }

    private function streamSample(mixed $stream): string
    {
        $this->rewindStream($stream);
        if (is_resource($stream)) {
            $sample = fread($stream, 8192) ?: '';
            $this->rewindStream($stream);

            return $sample;
        }
        if ($stream instanceof StreamInterface) {
            $sample = $stream->read(8192);
            $this->rewindStream($stream);

            return $sample;
        }

        return '';
    }
}
