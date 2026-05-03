<?php

declare(strict_types=1);

namespace TrueAdmin\Kernel\Constant;

final class ErrorCode
{
    public const SUCCESS = 0;
    public const BAD_REQUEST = 400000;
    public const VALIDATION_FAILED = 400001;
    public const UNAUTHORIZED = 401000;
    public const INVALID_CREDENTIALS = 401001;
    public const TOKEN_EXPIRED = 401002;
    public const FORBIDDEN = 403000;
    public const NOT_FOUND = 404000;
    public const SERVER_ERROR = 500000;
}
