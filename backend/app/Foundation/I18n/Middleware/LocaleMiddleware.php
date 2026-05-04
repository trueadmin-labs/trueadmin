<?php

declare(strict_types=1);

namespace App\Foundation\I18n\Middleware;

use Hyperf\Contract\ConfigInterface;
use Hyperf\Contract\TranslatorInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class LocaleMiddleware implements MiddlewareInterface
{
    private const SUPPORTED = ['zh_CN', 'en'];

    public function __construct(
        private readonly TranslatorInterface $translator,
        private readonly ConfigInterface $config,
    )
    {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $this->translator->setLocale($this->resolveLocale($request->getHeaderLine('Accept-Language')));

        return $handler->handle($request);
    }

    private function resolveLocale(string $header): string
    {
        foreach (explode(',', $header) as $item) {
            $locale = $this->normalizeLocale(trim(explode(';', $item, 2)[0] ?? ''));
            if ($locale !== null) {
                return $locale;
            }
        }

        return (string) $this->config->get('translation.locale', 'zh_CN');
    }

    private function normalizeLocale(string $locale): ?string
    {
        if ($locale === '') {
            return null;
        }

        $normalized = str_replace('-', '_', $locale);
        if (in_array($normalized, self::SUPPORTED, true)) {
            return $normalized;
        }

        $language = strtolower(explode('_', $normalized, 2)[0]);

        return match ($language) {
            'zh' => 'zh_CN',
            'en' => 'en',
            default => null,
        };
    }
}
