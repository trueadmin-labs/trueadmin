<?php

declare(strict_types=1);

use Hyperf\Database\Migrations\Migration;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Schema\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('admin_users', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('username', 64)->unique();
            $table->string('password');
            $table->string('nickname', 64)->default('');
            $table->string('status', 32)->default('enabled');
            $table->unsignedBigInteger('dept_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->datetimes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_users');
    }
};
