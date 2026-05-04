<?php

declare(strict_types=1);

namespace App\Module\Auth\Constant;

use Hyperf\Constants\Annotation\Constants;
use Hyperf\Constants\Annotation\Message;
use TrueAdmin\Kernel\Constant\ErrorCodeInterface;
use TrueAdmin\Kernel\Constant\ErrorCodeTrait;

#[Constants]
enum AuthErrorCode: string implements ErrorCodeInterface
{
    use ErrorCodeTrait;

    #[Message('errors.system.auth.invalid_credentials')]
    case INVALID_CREDENTIALS = 'SYSTEM.AUTH.INVALID_CREDENTIALS';
}
