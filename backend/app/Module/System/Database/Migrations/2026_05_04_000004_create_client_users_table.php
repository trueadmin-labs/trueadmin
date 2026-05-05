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
            $table->string('username', 64)->nullable()->unique();
            $table->string('phone', 32)->nullable()->unique();
            $table->string('email', 128)->nullable()->unique();
            $table->string('password')->nullable();
            $table->string('nickname', 64)->default('');
            $table->string('avatar', 255)->default('');
            $table->string('status', 32)->default('enabled');
            $table->string('register_channel', 64)->default('admin');
            $table->timestamp('last_login_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->datetimes();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_users');
    }
};
