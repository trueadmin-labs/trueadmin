<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use TrueAdmin\Kernel\Support\Password;
use App\Module\System\Model\AdminUser;
use App\Module\System\Repository\AdminUserRepository;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Context\Actor;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminProfileService
{
    private const PREFERENCES_NAMESPACE_MAX_BYTES = 16384;

    public function __construct(private readonly AdminUserRepository $users)
    {
    }

    public function detail(Actor $actor): array
    {
        return $this->profile($this->mustFind($actor));
    }

    public function update(Actor $actor, array $payload): array
    {
        $user = $this->users->update($this->mustFind($actor), [
            'nickname' => (string) $payload['nickname'],
            'avatar' => (string) ($payload['avatar'] ?? ''),
        ]);

        return $this->profile($user);
    }

    public function updatePassword(Actor $actor, array $payload): void
    {
        $user = $this->mustFind($actor);
        if (! Password::verify((string) $payload['oldPassword'], $this->users->passwordHash($user))) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
                'field' => 'oldPassword',
                'reason' => 'password_not_match',
            ]);
        }

        $this->users->update($user, [
            'password' => Password::make((string) $payload['newPassword']),
        ]);
    }

    public function updatePreferences(Actor $actor, array $payload): array
    {
        $user = $this->mustFind($actor);
        $preferences = $this->preferences($user);
        $this->assertPreferenceValueSize($payload['values']);
        $preferences[(string) $payload['namespace']] = $payload['values'];

        $user = $this->users->update($user, ['preferences' => $preferences]);

        return $this->profile($user);
    }

    private function mustFind(Actor $actor): AdminUser
    {
        if ($actor->type !== 'admin') {
            throw new BusinessException(ErrorCode::UNAUTHORIZED, 401);
        }

        $user = $this->users->findById($actor->id);
        if ($user === null) {
            throw new BusinessException(ErrorCode::UNAUTHORIZED, 401, ['reason' => 'admin_user_missing']);
        }

        return $user;
    }

    private function profile(AdminUser $user): array
    {
        return $this->users->toArray($user);
    }

    /** @return array<string, mixed> */
    private function preferences(AdminUser $user): array
    {
        $preferences = $user->getAttribute('preferences');

        return is_array($preferences) ? $preferences : [];
    }

    private function assertPreferenceValueSize(array $values): void
    {
        $json = json_encode($values, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false || strlen($json) > self::PREFERENCES_NAMESPACE_MAX_BYTES) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
                'field' => 'values',
                'reason' => 'preferences_too_large',
            ]);
        }
    }
}
