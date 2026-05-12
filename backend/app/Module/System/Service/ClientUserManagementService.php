<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use TrueAdmin\Kernel\Pagination\PageResult;
use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Service\AbstractService;
use TrueAdmin\Kernel\Support\Password;
use App\Module\System\Model\ClientUser;
use App\Module\System\Repository\ClientUserRepository;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class ClientUserManagementService extends AbstractService
{
    public function __construct(private readonly ClientUserRepository $users)
    {
    }

    public function paginate(CrudQuery $query): PageResult
    {
        return $this->users->paginate($query);
    }

    public function detail(int $id): array
    {
        return $this->users->toArray($this->mustFind($id));
    }

    public function create(array $payload): array
    {
        $this->assertIdentityPresent($payload);
        $this->assertUniqueIdentity($payload);

        $username = $this->optionalString($payload, 'username');
        $nickname = $this->optionalString($payload, 'nickname');
        $user = $this->users->create([
            'username' => $username === '' ? null : $username,
            'phone' => $this->nullableOptionalString($payload, 'phone'),
            'email' => $this->nullableOptionalString($payload, 'email'),
            'password' => Password::make((string) $payload['password']),
            'nickname' => $nickname !== '' ? $nickname : $this->defaultNickname($payload),
            'avatar' => $this->optionalString($payload, 'avatar'),
            'status' => (string) ($payload['status'] ?? 'enabled'),
            'register_channel' => $this->optionalString($payload, 'registerChannel') ?: 'admin',
        ]);

        return $this->detail((int) $user->getAttribute('id'));
    }

    public function update(int $id, array $payload): array
    {
        $user = $this->mustFind($id);
        $candidate = [
            'username' => array_key_exists('username', $payload) ? $this->optionalString($payload, 'username') : (string) ($user->getAttribute('username') ?? ''),
            'phone' => array_key_exists('phone', $payload) ? $this->optionalString($payload, 'phone') : (string) ($user->getAttribute('phone') ?? ''),
            'email' => array_key_exists('email', $payload) ? $this->optionalString($payload, 'email') : (string) ($user->getAttribute('email') ?? ''),
        ];
        $this->assertIdentityPresent($candidate);
        $this->assertUniqueIdentity($candidate, $id);

        $data = [];
        foreach (['username', 'phone', 'email'] as $field) {
            if (array_key_exists($field, $payload)) {
                $data[$field] = $this->nullableOptionalString($payload, $field);
            }
        }
        foreach (['nickname', 'avatar', 'status'] as $field) {
            if (array_key_exists($field, $payload)) {
                $data[$field] = $this->optionalString($payload, $field);
            }
        }
        if (array_key_exists('registerChannel', $payload)) {
            $data['register_channel'] = $this->optionalString($payload, 'registerChannel') ?: 'admin';
        }

        $password = trim((string) ($payload['password'] ?? ''));
        if ($password !== '') {
            $data['password'] = Password::make($password);
        }

        $user = $this->users->update($user, $data);

        return $this->detail((int) $user->getAttribute('id'));
    }

    public function delete(int $id): void
    {
        $this->users->delete($this->mustFind($id));
    }

    public function enable(int $id): array
    {
        return $this->changeStatus($id, 'enabled');
    }

    public function disable(int $id): array
    {
        return $this->changeStatus($id, 'disabled');
    }

    private function changeStatus(int $id, string $status): array
    {
        $user = $this->users->update($this->mustFind($id), ['status' => $status]);

        return $this->detail((int) $user->getAttribute('id'));
    }

    private function mustFind(int $id): ClientUser
    {
        $user = $this->users->findById($id);
        if ($user === null) {
            throw $this->notFound('client_user', $id);
        }

        return $user;
    }

    private function assertIdentityPresent(array $payload): void
    {
        if ($this->optionalString($payload, 'username') !== '' || $this->optionalString($payload, 'phone') !== '' || $this->optionalString($payload, 'email') !== '') {
            return;
        }

        throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'username|phone|email', 'reason' => 'identity_required']);
    }

    private function assertUniqueIdentity(array $payload, ?int $exceptId = null): void
    {
        $username = $this->optionalString($payload, 'username');
        $phone = $this->optionalString($payload, 'phone');
        $email = $this->optionalString($payload, 'email');

        $this->assertUnique($this->users->existsUsername($username, $exceptId), 'username');
        $this->assertUnique($this->users->existsPhone($phone, $exceptId), 'phone');
        $this->assertUnique($this->users->existsEmail($email, $exceptId), 'email');
    }

    private function defaultNickname(array $payload): string
    {
        foreach (['username', 'phone', 'email'] as $field) {
            $value = $this->optionalString($payload, $field);
            if ($value !== '') {
                return $value;
            }
        }

        return 'Client User';
    }

    private function nullableOptionalString(array $payload, string $field): ?string
    {
        $value = $this->optionalString($payload, $field);

        return $value === '' ? null : $value;
    }

    private function optionalString(array $payload, string $field): string
    {
        return trim((string) ($payload[$field] ?? ''));
    }
}
