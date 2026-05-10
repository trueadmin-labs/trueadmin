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

use DateTimeImmutable;
use DateTimeZone;
use GuzzleHttp\Exception\GuzzleException;
use Hyperf\Contract\ConfigInterface;
use Hyperf\Filesystem\FilesystemFactory;
use Hyperf\Guzzle\ClientFactory;
use League\Flysystem\Filesystem;
use OSS\Core\OssException;
use OSS\OssClient;
use Psr\Http\Message\UriInterface;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class FileStorageManager
{
    public function __construct(
        private readonly ConfigInterface $config,
        private readonly FilesystemFactory $filesystems,
        private readonly ClientFactory $clients,
    ) {
    }

    public function disk(): string
    {
        return (string) $this->config->get('file.default', 'local');
    }

    public function filesystem(string $disk): Filesystem
    {
        return $this->filesystems->get($disk);
    }

    public function maxSize(): int
    {
        return (int) $this->config->get('file.max_size', 20 * 1024 * 1024);
    }

    public function relativeUrl(string $disk, string $path): string
    {
        $base = (string) $this->config->get('file.storage.' . $disk . '.public_url', '');
        $path = ltrim($path, '/');

        if ($base === '' || str_starts_with($base, 'http://') || str_starts_with($base, 'https://')) {
            return '/' . $path;
        }

        return '/' . trim($base, '/') . '/' . $path;
    }

    public function absoluteUrl(string $disk, string $path, ?string $origin = null): string
    {
        $base = (string) $this->config->get('file.storage.' . $disk . '.public_url', '');
        $path = ltrim($path, '/');

        if (str_starts_with($base, 'http://') || str_starts_with($base, 'https://')) {
            return rtrim($base, '/') . '/' . $path;
        }

        $relative = $this->relativeUrl($disk, $path);
        $origin = $origin !== null ? rtrim($origin, '/') : '';

        return $origin === '' ? $relative : $origin . $relative;
    }

    public function presignedPutUrl(string $path, string $contentType): array
    {
        $this->assertOssReady();

        $ttl = $this->ossTimeout();
        $client = $this->ossClient();
        $options = [
            OssClient::OSS_CONTENT_TYPE => $contentType,
            OssClient::OSS_HEADERS => [
                OssClient::OSS_ACL => OssClient::OSS_ACL_TYPE_PUBLIC_READ,
            ],
        ];

        try {
            $url = $client->signUrl(
                (string) $this->config->get('file.storage.oss.bucket'),
                $path,
                $ttl,
                OssClient::OSS_HTTP_PUT,
                $options,
            );
        } catch (OssException $exception) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
                'field' => 'disk',
                'reason' => 'oss_presign_failed',
                'message' => $exception->getMessage(),
            ]);
        }

        return [
            'url' => $url,
            'expiresAt' => (new DateTimeImmutable('@' . (time() + $ttl)))->setTimezone(new DateTimeZone(date_default_timezone_get()))->format('Y-m-d H:i:s'),
            'headers' => [
                'Content-Type' => $contentType,
                OssClient::OSS_ACL => OssClient::OSS_ACL_TYPE_PUBLIC_READ,
            ],
        ];
    }

    /**
     * @return array{path:string, filename:string, size:int}
     */
    public function downloadRemoteFile(string $url, int $maxSize): array
    {
        $currentUrl = $this->assertRemoteUrl($url);
        $redirects = 0;
        $maxRedirects = max(0, (int) $this->config->get('file.remote.max_redirects', 3));

        while (true) {
            $target = $this->temporaryPath();
            $handle = fopen($target, 'w+b');
            if ($handle === false) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'url', 'reason' => 'remote_temp_file_unavailable']);
            }

            try {
                $response = $this->clients->create([
                    'connect_timeout' => (float) $this->config->get('file.remote.connect_timeout', 3),
                    'timeout' => (float) $this->config->get('file.remote.timeout', 15),
                    'http_errors' => false,
                    'allow_redirects' => false,
                ])->request('GET', $currentUrl, [
                    'sink' => $handle,
                    'headers' => ['Accept' => '*/*'],
                    'on_headers' => function ($response) use ($maxSize): void {
                        $length = $response->getHeaderLine('Content-Length');
                        if ($length !== '' && (int) $length > $maxSize) {
                            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'url', 'reason' => 'remote_file_size_invalid']);
                        }
                    },
                    'progress' => function (int $downloadTotal, int $downloadedBytes) use ($maxSize): void {
                        if (($downloadTotal > 0 && $downloadTotal > $maxSize) || $downloadedBytes > $maxSize) {
                            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'url', 'reason' => 'remote_file_size_invalid']);
                        }
                    },
                ]);
            } catch (BusinessException $exception) {
                fclose($handle);
                unlink($target);
                throw $exception;
            } catch (GuzzleException $exception) {
                fclose($handle);
                unlink($target);
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'url', 'reason' => 'remote_file_download_failed']);
            }
            fclose($handle);

            $status = $response->getStatusCode();
            if ($status >= 300 && $status < 400 && $response->hasHeader('Location')) {
                unlink($target);
                if ($redirects >= $maxRedirects) {
                    throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'url', 'reason' => 'remote_redirect_limit_exceeded']);
                }
                $currentUrl = $this->assertRemoteUrl((string) $response->getHeaderLine('Location'), $currentUrl);
                ++$redirects;
                continue;
            }

            if ($status < 200 || $status >= 300) {
                unlink($target);
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'url', 'reason' => 'remote_file_download_failed', 'status' => $status]);
            }

            $size = filesize($target) ?: 0;
            if ($size <= 0 || $size > $maxSize) {
                unlink($target);
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'url', 'reason' => 'remote_file_size_invalid']);
            }

            return [
                'path' => $target,
                'filename' => $this->remoteFilename($currentUrl, $response->getHeaderLine('Content-Disposition')),
                'size' => (int) $size,
            ];
        }
    }

    public function assertOssReady(): void
    {
        foreach (['accessId', 'accessSecret', 'bucket', 'endpoint', 'public_url'] as $key) {
            if ((string) $this->config->get('file.storage.oss.' . $key, '') === '') {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'disk', 'reason' => 'oss_not_configured']);
            }
        }
    }

    public function ossExpiresAt(): string
    {
        return (new DateTimeImmutable('@' . (time() + $this->ossTimeout())))->setTimezone(new DateTimeZone(date_default_timezone_get()))->format('Y-m-d H:i:s');
    }

    private function ossTimeout(): int
    {
        return max(60, (int) $this->config->get('file.storage.oss.timeout', 900));
    }

    private function ossClient(): OssClient
    {
        $client = new OssClient(
            (string) $this->config->get('file.storage.oss.accessId'),
            (string) $this->config->get('file.storage.oss.accessSecret'),
            (string) $this->config->get('file.storage.oss.endpoint'),
            (bool) $this->config->get('file.storage.oss.isCName', false),
        );
        $client->setUseSSL((bool) $this->config->get('file.storage.oss.use_ssl', true));
        $client->setTimeout($this->ossTimeout());

        return $client;
    }

    private function assertRemoteUrl(string $url, ?string $baseUrl = null): string
    {
        if ($baseUrl !== null) {
            $url = (string) \GuzzleHttp\Psr7\UriResolver::resolve(new \GuzzleHttp\Psr7\Uri($baseUrl), new \GuzzleHttp\Psr7\Uri($url));
        }

        $parts = parse_url($url);
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = (string) ($parts['host'] ?? '');
        if (! in_array($scheme, ['http', 'https'], true) || $host === '' || filter_var($url, FILTER_VALIDATE_URL) === false) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'url', 'reason' => 'remote_url_invalid']);
        }

        $this->assertPublicHost($host);

        return $url;
    }

    private function assertPublicHost(string $host): void
    {
        if (in_array(strtolower($host), ['localhost', 'localhost.localdomain'], true)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'url', 'reason' => 'remote_url_private']);
        }

        $records = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : gethostbynamel($host);
        if ($records === false || $records === []) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'url', 'reason' => 'remote_url_unresolvable']);
        }

        foreach ($records as $ip) {
            if (! $this->isPublicIp($ip)) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'url', 'reason' => 'remote_url_private']);
            }
        }
    }

    private function isPublicIp(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false;
    }

    private function temporaryPath(): string
    {
        $directory = BASE_PATH . '/runtime/file-remote';
        if (! is_dir($directory) && ! mkdir($directory, 0755, true) && ! is_dir($directory)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'url', 'reason' => 'remote_temp_file_unavailable']);
        }

        return $directory . '/' . bin2hex(random_bytes(16)) . '.tmp';
    }

    private function remoteFilename(string $url, string $contentDisposition): string
    {
        if (preg_match('/filename\*=UTF-8\'\'([^;]+)/i', $contentDisposition, $matches) === 1) {
            $filename = rawurldecode($matches[1]);
            if (trim($filename) !== '') {
                return basename($filename);
            }
        }
        if (preg_match('/filename="?([^";]+)"?/i', $contentDisposition, $matches) === 1 && trim($matches[1]) !== '') {
            return basename($matches[1]);
        }

        $path = parse_url($url, PHP_URL_PATH);
        $filename = is_string($path) ? basename($path) : '';

        return $filename !== '' && $filename !== '/' ? $filename : 'remote-file';
    }
}
