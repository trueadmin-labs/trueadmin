<?php

declare(strict_types=1);

use Hyperf\Database\Migrations\Migration;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Schema\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('client_users', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('nickname', 64)->default('');
            $table->string('mobile', 32)->nullable()->unique();
            $table->string('avatar', 512)->nullable();
            $table->string('status', 32)->default('enabled');
            $table->datetimes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_users');
    }
};
