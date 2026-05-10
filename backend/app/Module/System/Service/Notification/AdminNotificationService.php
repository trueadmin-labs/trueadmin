<?php

declare(strict_types=1);

namespace App\Module\System\Service\Notification;

use App\Foundation\Database\AfterCommitCallbacks;
use App\Module\System\Model\AdminNotificationBatch;
use App\Module\System\Repository\Notification\AdminNotificationBatchRepository;
use App\Module\System\Repository\Notification\AdminNotificationDeliveryRepository;
use Hyperf\DbConnection\Db;
use Psr\EventDispatcher\EventDispatcherInterface;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Context\ActorContext;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminNotificationService
{
    public function __construct(
        private readonly AdminNotificationBatchRepository $batches,
        private readonly AdminNotificationDeliveryRepository $deliveries,
        private readonly EventDispatcherInterface $dispatcher,
        private readonly AfterCommitCallbacks $afterCommit,
        private readonly AdminNotificationTemplateRegistry $templates,
        private readonly AttachmentSnapshotNormalizer $attachments,
    ) {
    }

    /**
     * @param array<string, mixed> $input
     */
    public function send(array $input): array
    {
        $input = $this->normalizeInput($input);

        return Db::transaction(function () use ($input): array {
            $batch = $this->createBatch($input);
            if (($input['afterCommit'] ?? false) === true && Db::transactionLevel() > 0) {
                $batchId = (int) $batch->getAttribute('id');
                $this->afterCommit->run(fn (): array => $this->deliverBatch($batchId, $input));

                return $this->batches->toArray($batch);
            }

            return $this->deliverBatch((int) $batch->getAttribute('id'), $input);
        });
    }

    private function createBatch(array $input): AdminNotificationBatch
    {
        $actor = ActorContext::operator();
        $rendered = $this->renderNotification($input);

        return $this->batches->create([
            'type' => (string) ($input['type'] ?? 'system'),
            'level' => (string) ($input['level'] ?? 'info'),
            'source' => (string) ($input['source'] ?? 'system'),
            'targets' => $this->normalizeTargets($input),
            'template_key' => $input['templateKey'] ?? null,
            'template_variables' => $input['variables'] ?? [],
            'fallback_title' => $rendered['title'],
            'fallback_content' => $rendered['content'],
            'payload' => $input['payload'] ?? [],
            'attachments' => $input['attachments'] ?? [],
            'target_url' => $input['targetUrl'] ?? null,
            'dedupe_key' => $input['dedupeKey'] ?? null,
            'dedupe_ttl_seconds' => $input['dedupeTtlSeconds'] ?? null,
            'expires_at' => $input['expiresAt'] ?? null,
            'status' => 'sending',
            'operator_type' => $input['operatorType'] ?? ($actor === null ? 'system' : 'admin'),
            'operator_id' => $input['operatorId'] ?? ($actor === null ? null : (int) $actor->id),
            'operator_dept_id' => $input['operatorDeptId'] ?? ($actor === null ? null : ($actor->claims['operationDeptId'] ?? $actor->claims['primaryDeptId'] ?? null)),
            'operator_name' => $input['operatorName'] ?? ($actor?->name ?? ''),
            'impersonator_id' => $input['impersonatorId'] ?? null,
        ]);
    }

    private function deliverBatch(int $batchId, array $input): array
    {
        return Db::transaction(function () use ($batchId, $input): array {
            $batch = $this->batches->findById($batchId);
            if ($batch === null) {
                return ['id' => $batchId, 'status' => 'skipped', 'reason' => 'batch_not_found'];
            }
            if ((string) $batch->getAttribute('status') !== 'sending') {
                return $this->batches->toArray($batch);
            }

            $stats = $this->createDeliveries($batch, $input);
            $status = $stats['failed'] > 0 ? ($stats['sent'] > 0 ? 'partial_failed' : 'failed') : 'completed';
            $batch = $this->batches->update($batch, ['status' => $status]);

            if ($stats['sent'] > 0) {
                $this->dispatcher->dispatch(new AdminMessageChangedEvent('notification_created'));
            }

            return $this->batches->toArray($batch);
        });
    }

    /** @param array<string, mixed> $input */
    private function createDeliveries(AdminNotificationBatch $batch, array $input): array
    {
        $targets = $this->resolveTargets($input);
        $rendered = $this->renderNotification($input);
        $sent = 0;
        $failed = 0;
        $skipped = 0;
        $seen = [];

        foreach ($targets as $target) {
            $receiverId = (int) $target['id'];
            $receiverName = (string) ($target['name'] ?? '');
            $skipReason = $target['skipReason'] ?? null;

            if ($receiverId > 0 && isset($seen[$receiverId])) {
                $skipReason = 'duplicated';
            }
            if ($receiverId > 0) {
                $seen[$receiverId] = true;
            }
            if ($skipReason === null && $receiverId > 0 && $this->isDuplicated($receiverId, $input)) {
                $skipReason = 'duplicated';
            }

            $status = $skipReason === null ? 'sent' : 'skipped';
            $this->deliveries->create([
                'batch_id' => (int) $batch->getAttribute('id'),
                'receiver_id' => $receiverId,
                'receiver_name' => $receiverName,
                'locale' => (string) ($target['locale'] ?? 'zh_CN'),
                'title' => $rendered['title'],
                'content' => $rendered['content'],
                'payload' => $input['payload'] ?? [],
                'attachments' => $input['attachments'] ?? [],
                'target_url' => $input['targetUrl'] ?? null,
                'status' => $status,
                'skip_reason' => $skipReason,
                'sent_at' => $status === 'sent' ? date('Y-m-d H:i:s') : null,
                'expires_at' => $input['expiresAt'] ?? null,
            ]);

            if ($status === 'sent') {
                ++$sent;
            } else {
                ++$skipped;
            }
        }

        return ['sent' => $sent, 'failed' => $failed, 'skipped' => $skipped];
    }

    /** @param array<string, mixed> $input */
    private function normalizeInput(array $input): array
    {
        $input['type'] = $this->nonEmptyString($input['type'] ?? 'system', 'type', 64);
        $input['level'] = $this->enumString($input['level'] ?? 'info', 'level', ['info', 'success', 'warning', 'error']);
        $input['source'] = $this->nonEmptyString($input['source'] ?? 'system', 'source', 64);
        $input['templateKey'] = $this->nullableString($input['templateKey'] ?? null, 'templateKey', 128);
        $input['title'] = $this->nullableString($input['title'] ?? null, 'title', 255);
        $input['content'] = array_key_exists('content', $input) ? (string) ($input['content'] ?? '') : null;
        $input['variables'] = $this->arrayValue($input['variables'] ?? [], 'variables');
        $input['payload'] = $this->arrayValue($input['payload'] ?? [], 'payload');
        $input['attachments'] = $this->attachments->normalize($input['attachments'] ?? []);
        $input['targetUrl'] = $this->targetUrl($input['targetUrl'] ?? null);
        $input['dedupeKey'] = $this->nullableString($input['dedupeKey'] ?? null, 'dedupeKey', 191);
        $input['dedupeTtlSeconds'] = $this->positiveNullableInt($input['dedupeTtlSeconds'] ?? null, 'dedupeTtlSeconds');
        $input['expiresAt'] = $this->nullableDateTime($input['expiresAt'] ?? null, 'expiresAt');
        $input['receiverIds'] = $this->intList($input['receiverIds'] ?? [], 'receiverIds');
        $input['roleIds'] = $this->intList($input['roleIds'] ?? [], 'roleIds');
        $input['roleCodes'] = $this->stringList($input['roleCodes'] ?? [], 'roleCodes', 64);
        $input['targets'] = $this->targetList($input['targets'] ?? []);

        if ($this->normalizeTargets($input) === []) {
            $this->fail('targets', 'notification_target_required');
        }

        if ($input['templateKey'] === null && ($input['title'] === null || trim($input['title']) === '')) {
            $this->fail('title', 'notification_title_or_template_required');
        }
        if ($input['templateKey'] !== null && ! $this->templates->has($input['templateKey']) && ($input['title'] === null || trim($input['title']) === '')) {
            $this->fail('templateKey', 'notification_template_not_registered');
        }

        return $input;
    }

    /**
     * @param array<string, mixed> $input
     * @return array{title: string, content: string}
     */
    private function renderNotification(array $input): array
    {
        $variables = is_array($input['variables'] ?? null) ? $input['variables'] : [];
        if (($input['templateKey'] ?? null) !== null) {
            return $this->templates->render((string) $input['templateKey'], $variables, $input['title'] ?? null, $input['content'] ?? null);
        }

        return [
            'title' => $this->renderText((string) ($input['title'] ?? ''), $variables),
            'content' => $this->renderText((string) ($input['content'] ?? ''), $variables),
        ];
    }

    /** @param array<string, mixed> $input */
    private function normalizeTargets(array $input): array
    {
        $targets = [];
        foreach ($input['receiverIds'] ?? [] as $id) {
            $targets[] = ['type' => 'admin', 'value' => (int) $id];
        }
        foreach ($input['roleIds'] ?? [] as $id) {
            $targets[] = ['type' => 'role', 'value' => (int) $id];
        }
        foreach ($input['roleCodes'] ?? [] as $code) {
            $targets[] = ['type' => 'role_code', 'value' => (string) $code];
        }
        foreach ($input['targets'] ?? [] as $target) {
            if (is_array($target) && isset($target['type'], $target['value'])) {
                $targets[] = ['type' => (string) $target['type'], 'value' => $target['value']];
            }
        }

        return $targets;
    }

    /** @param array<string, mixed> $input */
    private function resolveTargets(array $input): array
    {
        $targets = $this->normalizeTargets($input);
        $adminIds = [];
        $roleIds = [];
        $roleCodes = [];

        foreach ($targets as $target) {
            $type = (string) $target['type'];
            if ($type === 'admin') {
                $adminIds[] = (int) $target['value'];
            } elseif ($type === 'role') {
                $roleIds[] = (int) $target['value'];
            } elseif ($type === 'role_code') {
                $roleCodes[] = (string) $target['value'];
            }
        }

        if ($roleCodes !== []) {
            $roleIds = array_merge($roleIds, Db::table('admin_roles')->whereIn('code', array_values(array_unique($roleCodes)))->pluck('id')->map(static fn (mixed $id): int => (int) $id)->all());
        }
        if ($roleIds !== []) {
            $adminIds = array_merge($adminIds, Db::table('admin_role_user')->whereIn('role_id', array_values(array_unique($roleIds)))->pluck('user_id')->map(static fn (mixed $id): int => (int) $id)->all());
        }

        $adminIds = array_values(array_unique(array_filter($adminIds, static fn (int $id): bool => $id > 0)));
        if ($adminIds === []) {
            return [];
        }

        $users = Db::table('admin_users')
            ->whereIn('id', $adminIds)
            ->get()
            ->keyBy('id');
        $resolved = [];
        foreach ($adminIds as $adminId) {
            $user = $users->get($adminId);
            if ($user === null) {
                $resolved[] = ['id' => $adminId, 'name' => '', 'skipReason' => 'missing_admin'];
                continue;
            }
            $resolved[] = [
                'id' => $adminId,
                'name' => (string) ($user->nickname ?: $user->username),
                'skipReason' => (string) $user->status === 'enabled' ? null : 'disabled_admin',
            ];
        }

        return $resolved;
    }

    /** @param array<string, mixed> $input */
    private function isDuplicated(int $receiverId, array $input): bool
    {
        $dedupeKey = trim((string) ($input['dedupeKey'] ?? ''));
        if ($dedupeKey === '') {
            return false;
        }

        $query = Db::table('admin_notification_deliveries')
            ->join('admin_notification_batches', 'admin_notification_batches.id', '=', 'admin_notification_deliveries.batch_id')
            ->where('admin_notification_batches.dedupe_key', $dedupeKey)
            ->where('admin_notification_deliveries.receiver_id', $receiverId)
            ->where('admin_notification_deliveries.status', 'sent');

        if (isset($input['dedupeTtlSeconds']) && $input['dedupeTtlSeconds'] !== null) {
            $seconds = max(1, (int) $input['dedupeTtlSeconds']);
            $query->where('admin_notification_deliveries.created_at', '>=', date('Y-m-d H:i:s', time() - $seconds));
        }

        return $query->exists();
    }

    private function renderText(string $template, mixed $variables): string
    {
        if (! is_array($variables) || $variables === []) {
            return $template;
        }

        foreach ($variables as $key => $value) {
            if (is_scalar($value)) {
                $template = str_replace('{{' . (string) $key . '}}', (string) $value, $template);
            }
        }

        return $template;
    }

    private function nonEmptyString(mixed $value, string $field, int $max): string
    {
        $value = trim((string) $value);
        if ($value === '' || mb_strlen($value) > $max) {
            $this->fail($field, $field . '_invalid');
        }

        return $value;
    }

    private function nullableString(mixed $value, string $field, int $max): ?string
    {
        if ($value === null) {
            return null;
        }
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }
        if (mb_strlen($value) > $max) {
            $this->fail($field, $field . '_too_long');
        }

        return $value;
    }

    /** @param list<string> $allowed */
    private function enumString(mixed $value, string $field, array $allowed): string
    {
        $value = trim((string) $value);
        if (! in_array($value, $allowed, true)) {
            $this->fail($field, $field . '_invalid');
        }

        return $value;
    }

    private function arrayValue(mixed $value, string $field): array
    {
        if (! is_array($value)) {
            $this->fail($field, $field . '_must_be_array');
        }

        return $value;
    }

    private function targetUrl(mixed $value): ?string
    {
        $value = $this->nullableString($value, 'targetUrl', 512);
        if ($value === null) {
            return null;
        }
        if (str_starts_with($value, '/')) {
            if (str_starts_with($value, '//')) {
                $this->fail('targetUrl', 'target_url_invalid');
            }

            return $value;
        }
        $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));
        if (! in_array($scheme, ['http', 'https'], true) || filter_var($value, FILTER_VALIDATE_URL) === false) {
            $this->fail('targetUrl', 'target_url_invalid');
        }

        return $value;
    }

    private function positiveNullableInt(mixed $value, string $field): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (! is_numeric($value) || (int) $value <= 0) {
            $this->fail($field, $field . '_invalid');
        }

        return (int) $value;
    }

    private function nullableDateTime(mixed $value, string $field): ?string
    {
        $value = $this->nullableString($value, $field, 32);
        if ($value === null) {
            return null;
        }
        if (strtotime($value) === false) {
            $this->fail($field, $field . '_invalid');
        }

        return $value;
    }

    private function intList(mixed $value, string $field): array
    {
        if (! is_array($value)) {
            $this->fail($field, $field . '_must_be_array');
        }

        return array_values(array_unique(array_filter(array_map('intval', $value), static fn (int $id): bool => $id > 0)));
    }

    private function stringList(mixed $value, string $field, int $max): array
    {
        if (! is_array($value)) {
            $this->fail($field, $field . '_must_be_array');
        }

        $items = [];
        foreach ($value as $item) {
            $item = trim((string) $item);
            if ($item === '' || mb_strlen($item) > $max) {
                $this->fail($field, $field . '_invalid');
            }
            $items[] = $item;
        }

        return array_values(array_unique($items));
    }

    private function targetList(mixed $value): array
    {
        if (! is_array($value)) {
            $this->fail('targets', 'targets_must_be_array');
        }

        $targets = [];
        foreach ($value as $index => $target) {
            if (! is_array($target) || ! isset($target['type'], $target['value'])) {
                $this->fail('targets.' . $index, 'target_invalid');
            }
            $type = $this->enumString($target['type'], 'targets.' . $index . '.type', ['admin', 'role', 'role_code']);
            $value = $type === 'role_code'
                ? $this->nonEmptyString($target['value'], 'targets.' . $index . '.value', 64)
                : (int) $target['value'];
            if ($type !== 'role_code' && $value <= 0) {
                $this->fail('targets.' . $index . '.value', 'target_value_invalid');
            }
            $targets[] = [
                'type' => $type,
                'value' => $value,
            ];
        }

        return $targets;
    }

    private function fail(string $field, string $reason): never
    {
        throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
            'field' => $field,
            'reason' => $reason,
        ]);
    }
}
