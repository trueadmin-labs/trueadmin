<?php

declare(strict_types=1);

namespace App\Module\System\Service\Notification;

use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminNotificationTemplateRegistry
{
    /** @var array<string, array{title: string, content: string}> */
    private static array $templates = [];

    /**
     * @param array{title?: string, content?: string} $template
     */
    public function register(string $key, array $template): void
    {
        $key = trim($key);
        $title = trim((string) ($template['title'] ?? ''));
        $content = (string) ($template['content'] ?? '');

        if ($key === '') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
                'field' => 'templateKey',
                'reason' => 'template_key_required',
            ]);
        }
        if ($title === '') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
                'field' => 'title',
                'reason' => 'template_title_required',
            ]);
        }

        self::$templates[$key] = [
            'title' => $title,
            'content' => $content,
        ];
    }

    public function has(string $key): bool
    {
        return isset(self::$templates[trim($key)]);
    }

    /**
     * @param array<string, mixed> $variables
     * @return array{title: string, content: string}
     */
    public function render(string $key, array $variables = [], ?string $fallbackTitle = null, ?string $fallbackContent = null): array
    {
        $key = trim($key);
        $template = self::$templates[$key] ?? null;

        if ($template === null) {
            if ($fallbackTitle === null || trim($fallbackTitle) === '') {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
                    'field' => 'templateKey',
                    'reason' => 'notification_template_not_registered',
                ]);
            }

            return [
                'title' => $this->renderText($fallbackTitle, $variables),
                'content' => $this->renderText((string) ($fallbackContent ?? ''), $variables),
            ];
        }

        return [
            'title' => $this->renderText($template['title'], $variables),
            'content' => $this->renderText($template['content'], $variables),
        ];
    }

    /** @param array<string, mixed> $variables */
    private function renderText(string $template, array $variables): string
    {
        foreach ($variables as $key => $value) {
            if (is_scalar($value) || $value === null) {
                $template = str_replace('{{' . (string) $key . '}}', (string) $value, $template);
            }
        }

        return $template;
    }
}
