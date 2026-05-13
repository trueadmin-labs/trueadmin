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

namespace App\Module\Auth\Service;

use Hyperf\Config\Annotation\Value;
use RuntimeException;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class JwtService
{
    private const MIN_SECRET_LENGTH = 32;

    #[Value('jwt.secret')]
    private string $secret;

    #[Value('jwt.ttl')]
    private int $ttl;

    #[Value('jwt.issuer')]
    private string $issuer;

    public function issue(array $claims): string
    {
        $this->assertSecretConfigured();
        $now = time();
        $payload = array_merge($claims, [
            'iss' => $this->issuer,
            'iat' => $now,
            'exp' => $now + $this->ttl,
        ]);

        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $segments = [
            $this->base64UrlEncode(json_encode($header, JSON_THROW_ON_ERROR)),
            $this->base64UrlEncode(json_encode($payload, JSON_THROW_ON_ERROR)),
        ];

        $segments[] = $this->signature($segments[0], $segments[1]);

        return implode('.', $segments);
    }

    public function parse(string $token): array
    {
        $this->assertSecretConfigured();
        $segments = explode('.', $token);
        if (count($segments) !== 3) {
            throw new BusinessException(ErrorCode::UNAUTHORIZED, 401, ['reason' => 'invalid_token']);
        }

        [$header, $payload, $signature] = $segments;
        if (! hash_equals($this->signature($header, $payload), $signature)) {
            throw new BusinessException(ErrorCode::UNAUTHORIZED, 401, ['reason' => 'invalid_signature']);
        }

        $claims = json_decode($this->base64UrlDecode($payload), true, 512, JSON_THROW_ON_ERROR);
        if (($claims['exp'] ?? 0) < time()) {
            throw new BusinessException(ErrorCode::TOKEN_EXPIRED, 401);
        }

        return $claims;
    }

    private function signature(string $header, string $payload): string
    {
        return $this->base64UrlEncode(hash_hmac('sha256', $header . '.' . $payload, $this->secret, true));
    }

    private function assertSecretConfigured(): void
    {
        $secret = trim($this->secret);
        if ($secret === '' || $secret === 'change-me' || strlen($secret) < self::MIN_SECRET_LENGTH) {
            throw new RuntimeException('JWT_SECRET must be configured with at least 32 characters before issuing admin tokens.');
        }
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        return base64_decode(strtr($value, '-_', '+/')) ?: '';
    }
}
